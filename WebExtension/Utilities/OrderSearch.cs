using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Disco.Data.Extensibility.Data.SQL;
using Disco.Extensions;
using Disco.Extensions.Abstractions.Orders;

namespace WebExtension.Utilities
{
    public class OrderSearch
    {
        public static OrderInfo[] GetShippableOrders(DateTime begin, DateTime end, object code, object name, object category)
        {
            var result = new List<OrderInfo>();

            foreach (var order in GetOrdersByDateRange(begin, end, code, name, category))
            {
                if (order.InvoiceDate > DateTime.MinValue)
                {
                    result.Add(order);
                }
            }

            return result.ToArray();
        }

        public static OrderInfo[] GetOrdersByDateRange(DateTime begin, DateTime end, object code, object name, object category)
        {
            ComplexQuery qry;
            var qryst = "SELECT distinct O.recordnumber from ORD_ORder O join ORD_OrderPackages P on O.recordnumber = P.OrderNumber where O.OrderDate >= '{0}' AND O.OrderDate < '{1}' ";



            qry = name == "All" ? new ComplexQuery(qryst, begin, end.AddDays(1)) : new ComplexQuery(qryst + " AND P.WarehouseID = '{2}' ", begin, end.AddDays(1), code);



            var orderNos = new List<int>();
            using (var rdr = ServiceLocator.Instance.Data.GetReader(qry))
            {
                while (rdr.Read())
                {
                    orderNos.Add(rdr.GetInt32("recordnumber"));
                }
            }

            var x = ServiceLocator.Instance.OrderService.GetOrdersWSort(orderNos.ToArray(), "ASC");
            return x.Where(orderInfo => !orderInfo.IsShipped).ToArray();
        }
    }
}
