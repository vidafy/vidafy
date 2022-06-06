using Dapper;
using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Views.Model;

namespace WebExtension.Repositories
{
    public interface IOrderWebRepository
    {
        List<int> GetFilteredOrderIds(string search, DateTime beginDate, DateTime endDate);
        List<Bom> billOfMaterialItems(int itemId);
        List<ActiveCountry> GetWarehouseItemDetails();
        Order[] GetShippableOrders(DateTime begin, DateTime end, object code, object name, object category);
    }
    public class OrderWebRepository : IOrderWebRepository
    {
        private readonly IDataService _dataService;
        private readonly IOrderService _orderService;

        public OrderWebRepository(IDataService dataService, IOrderService orderService)
        {
            _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
            _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
        }

        public List<ActiveCountry> GetWarehouseItemDetails()
        {
            using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
            {
                var searchCategory = new List<ActiveCountry>();
                var queryStatement = $@"Select WarehouseName  Name, recordnumber Code from  Inv_wareHouse";
                return dbConnection.Query<ActiveCountry>(queryStatement).ToList();
            }
        }
        private Order[] GetOrdersByDateRange(DateTime begin, DateTime end, object code, object name, object category)
        {
            // ComplexQuery qry;
            var qryst = "";
            begin = begin.AddMonths(-1);
            var orderNos = new List<int>();
            end = end.AddDays(1);
            name = "All";

            if ((string)name == "All")
            {
                using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
                {
                    var parameters = new
                    {
                        begin,
                        end
                    };
                    qryst = "SELECT distinct O.recordnumber from ORD_ORder O join ORD_OrderPackages P on O.recordnumber = P.OrderNumber where O.OrderDate >= @begin AND O.OrderDate < @end ";
                    orderNos = dbConnection.Query<int>(qryst, parameters).ToList();
                }
            }
            else
            {
                using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
                {
                    var parameters = new
                    {
                        begin,
                        end,
                        code
                    };
                    qryst = "SELECT distinct O.recordnumber from ORD_ORder O join ORD_OrderPackages P on O.recordnumber = P.OrderNumber where O.OrderDate >= @begin AND O.OrderDate < @end ";
                    qryst = qryst + " AND P.WarehouseID = @code ";
                    orderNos = dbConnection.Query<int>(qryst, parameters).ToList();
                }
            }
            var x = _orderService.GetOrdersWSort(orderNos.ToArray(), "ASC");

            List<Order> newList = new List<Order>();
            foreach (var orderInfo in x.Result)
            {
                if (!orderInfo.IsShipped)
                {
                    newList.Add(orderInfo);
                }

            }
            return newList.ToArray();
        }

        public Order[] GetShippableOrders(DateTime begin, DateTime end, object code, object name, object category)
        {
            var result = new List<Order>();

            foreach (var order in GetOrdersByDateRange(begin, end, code, name, category))
            {
                if (order.InvoiceDate > DateTime.MinValue)
                {
                    result.Add(order);
                }
            }

            return result.ToArray();
        }
        public List<int> GetFilteredOrderIds(string search, DateTime beginDate, DateTime endDate)
        {
            using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
            {
                var parameters = new
                {
                    beginDate,
                    endDate
                };

                var queryStatement = $@"
                    SELECT DISTINCT
                            o.RecordNumber 
                    FROM ORD_Order o
                    JOIN CRM_Distributors D 
                        ON o.DistributorID = D.RecordNumber 
                    WHERE o.Void = 0
                        AND CAST(o.OrderDate AS DATE) >= @beginDate 
                        AND CAST(o.OrderDate AS DATE) <= @endDate
                    {BuildOrderFilterClause(search)}
                    ORDER BY o.RecordNumber DESC
                ";

                return dbConnection.Query<int>(queryStatement, parameters).ToList();
            }
        }
        private string BuildOrderFilterClause(string search)
        {
            var sql = string.Empty;

            if (!string.IsNullOrWhiteSpace(search))
            {
                sql += string.Format(@" AND (
                        o.Name LIKE '%{0}%' OR 
                        o.Email LIKE '%{0}%' OR 
                        o.RecordNumber LIKE {0} OR 
                        o.SpecialInstructions LIKE '%{0}%' OR 
                        p.Reference LIKE '%{0}%' OR 
                        d.BackofficeID = '{0}')", search);
            }

            return sql;
        }

        public  List<Bom> billOfMaterialItems(int itemId)
        {
            using (var dbConnection = new SqlConnection( _dataService.GetClientConnectionString().Result))
            {
                string sql = @"SELECT B.[ItemID], B.[Qty], I.[SKU], L.[ProductName] AS EnglishDescription FROM [dbo].[INV_BOM] B
                JOIN [dbo].[INV_Inventory] I ON I.[recordnumber] = B.[ItemID] AND I.[HasKitGroups] = 0
                LEFT JOIN [dbo].[INV_LanguageValues] L ON L.[ItemID] = B.[ItemID] AND L.[LanguageCode] = 'en'
                WHERE B.[ParentItemID] = @ItemId;";

                return dbConnection.Query<Bom>(sql, new { ItemId = itemId }).ToList();
            }
        }
    }
}
