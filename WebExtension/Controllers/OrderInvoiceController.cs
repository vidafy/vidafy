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
using WebExtension.Helper;
using Microsoft.AspNetCore.Authorization;

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
        public async Task<IActionResult> Index(string category, string catName, string code, string getOrders, string begDate, string endDate, int orderNumber=0)
        {
            ViewData["WarehouseDetails"] = _ordrWebService.GetWareHouseDetails();

            if(orderNumber != 0)
                ViewData["InvoiceData"] = _extOrderService.GetInvoiceData(orderNumber);

            ViewData["category"] = category;
            ViewData["catName"] = catName; 
            ViewData["code"] = code;
            ViewData["getOrders"] = getOrders;
            ViewData["begDate"] = begDate;
            ViewData["endDate"] = endDate;
            ViewData["orderNumber"] = orderNumber;
            return await Task.Run(() => View());
        }


        [ExtensionAuthorize]
        public async Task<IActionResult> Invoice([FromQuery] int orderNumber)
        {
            var invoiceData = await _extOrderService.GetInvoiceData(orderNumber);

            if (invoiceData == null || invoiceData.OrderNumber == 0)
            {
                return NotFound();
            }

            Title = $"Order Invoice: #{invoiceData.OrderNumber} - {invoiceData.FirstLastName} - {invoiceData.Date}";
            ViewData["InvoiceData"] = (WebExtension.Views.Model.Invoice)invoiceData;

            return await Task.Run(() => View());
        }


        [ExtensionAuthorize]
        public async Task<IActionResult> InvoiceAll([FromQuery] string orderNumbers)
        {
            var listOrder = orderNumbers.Split('|').ToList();
            var invoices = new List<Invoice>();

            foreach (var orderNumber in listOrder)
            {
                var isParsable = int.TryParse(orderNumber, out var numberOnOrder);
                if (!isParsable) continue;
                var invoiceData = await _extOrderService.GetInvoiceData(numberOnOrder);
                if (invoiceData == null || invoiceData.OrderNumber == 0)
                {
                }
                else
                {
                    invoices.Add(invoiceData);
                }
            }
            ViewData["InvoiceDataAll"] = invoices;
            return await Task.Run(() => View());
        }
    }
}
