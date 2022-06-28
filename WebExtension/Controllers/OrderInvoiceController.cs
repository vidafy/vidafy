using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Services;
using WebExtension.Views.Model;
using Microsoft.AspNetCore.Cors;

namespace WebExtension.Controllers
{
    [EnableCors("CorsPolicy")]
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
        public async Task<IActionResult> Index(string category, string catName, string code, string getOrders, string begDate, string endDate)
        {
            ViewData["WarehouseDetails"] = _ordrWebService.GetWareHouseDetails();
            ViewData["category"] = category;
            ViewData["catName"] = catName; 
            ViewData["code"] = code;
            ViewData["getOrders"] = getOrders;
            ViewData["begDate"] = begDate;
            ViewData["endDate"] = endDate;            
            return await Task.Run(() => View());
        }
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

        public async Task<IActionResult> InvoiceAll([FromQuery] DateTime begDate, 
            [FromQuery] DateTime endDate, [FromQuery] string code, [FromQuery] string catName, [FromQuery] string category)
        {
            var invoices = new List<Invoice>();
            var orderNumbers = _ordrWebService.GetShippableOrders(begDate, endDate, code, catName, category);
            if (orderNumbers == null)
            {
                ViewData["InvoiceDataAll"] = invoices;
                return await Task.Run(View);
            }

            foreach (var orderNumber in orderNumbers)
            {
                var numberOnOrder = orderNumber.OrderNumber;
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
            return await Task.Run(View);
        }
    }
}
