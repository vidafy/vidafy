using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DirectScale.Disco.Extension.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using WebExtension.Models;
using WebExtension.Services;
using Microsoft.AspNetCore.Cors;

namespace WebExtension.Controllers
{
    public class OrderInvoiceController : Controller
    {
        private readonly IOrderWebService _ordrWebService;

        public OrderInvoiceController(IOrderWebService ordrWebService
        )
        {
            _ordrWebService = ordrWebService ?? throw new ArgumentNullException(nameof(ordrWebService));
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
    }
}
