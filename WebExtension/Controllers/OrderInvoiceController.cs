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
namespace WebExtension.Controllers
{
    public class OrderInvoiceController : Controller
    {
        [ExtensionAuthorize]
        public IActionResult Index()
        {
            return View();
        }
    }
}
