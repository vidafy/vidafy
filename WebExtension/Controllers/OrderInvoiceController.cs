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
        public IActionResult Index()
        {  
            ViewData["WarehouseDetails"] = _ordrWebService.GetWareHouseDetails();
            return View();
        }
    }
}
