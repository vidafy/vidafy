﻿using Microsoft.AspNetCore.Mvc;
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
        public IActionResult Index(string category, string catName, string code, string getOrders, string begDate, string endDate)
        {  
            ViewData["WarehouseDetails"] = _ordrWebService.GetWareHouseDetails();
            ViewData["category"] = category ;
            ViewData["catName"] = catName; ;
            ViewData["code"] = code ;
            ViewData["getOrders"] = getOrders;
            ViewData["begDate"] = begDate;
            ViewData["endDate"] = endDate;
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


        [ExtensionAuthorize]
        public IActionResult InvoiceAll([FromQuery] string orderNumbers)
        {
            List<string> listOrder = new List<string>();
            listOrder = orderNumbers.Split('|').ToList();
            List<Invoice> Invoices = new List<Invoice>();

            foreach (var orderNumber in listOrder)
            {
                int numberOnOrder;
                bool isParsable = Int32.TryParse(orderNumber, out numberOnOrder);
                if (isParsable)
                {
                    Invoice invoiceData = _extOrderService.GetInvoiceData(numberOnOrder);
                    if (invoiceData == null || invoiceData.OrderNumber == 0)
                    {
                    }
                    else
                    {
                        Invoices.Add(invoiceData);
                    }
                }
            }
            ViewData["InvoiceDataAll"] = Invoices;
            return View();
        }
    }
}
