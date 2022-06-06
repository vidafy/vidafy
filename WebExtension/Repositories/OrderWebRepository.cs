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
    }
    public class OrderWebRepository : IOrderWebRepository
    {
        private readonly IDataService _dataService;

        public OrderWebRepository(IDataService dataService)
        {
            _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
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
