using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DirectScale.Disco.Extension.Middleware;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using WebExtension.Services;
using WebExtension.Views.Model;

namespace WebExtension.Controllers
{
    public class OrderInvoiceController : Controller
    {
        private readonly IOrderWebService _ordrWebService;
        private readonly IExtensionOrderService _extOrderService;


        [ViewData]
        public string Title { get; set; }

        public OrderInvoiceController(IOrderWebService ordrWebService, IExtensionOrderService extOrderService)
        {
            _ordrWebService = ordrWebService ?? throw new ArgumentNullException(nameof(ordrWebService));
            _extOrderService = extOrderService ?? throw new ArgumentNullException(nameof(extOrderService));
        }

       [ExtensionAuthorize]

        public IActionResult Index(string Category, string CatName, string Code, string GetOrders)
        {  
            ViewData["WarehouseDetails"] = _ordrWebService.GetWareHouseDetails();
            ViewData["category"] = Category ;
            ViewData["catName"] = CatName; ;
            ViewData["code"] = Code ;
            ViewData["getOrders"] = GetOrders;
            //ViewData["ShippableOrderDetails"] = _ordrWebService.GetShippableOrders()
            return View();
        }


        [ExtensionAuthorize]
        public  IActionResult Invoice([FromQuery] int orderNumber)
        {
            Invoice invoiceData = _extOrderService.GetInvoiceData(orderNumber);

            if (invoiceData == null || invoiceData.OrderNumber == 0)
            {
                return NotFound();
            }

            Title = $"Order Invoice: #{invoiceData.OrderNumber} - {invoiceData.FirstLastName} - {invoiceData.Date}";
            ViewData["InvoiceData"] = invoiceData;

            return View();
        }
    }
}
