using Dapper;
using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Models;
using WebExtension.Services;

namespace WebExtension.Controllers
{
    [Route("Command/[controller]")]
    [ApiController]
    public class ClientApiController : ControllerBase
    {
        private readonly IOrderWebService _orderWebService;

        public ClientApiController(IOrderWebService orderWebService)
        {
            _orderWebService = orderWebService ?? throw new ArgumentNullException(nameof(orderWebService));
        }


        [HttpGet]
        [Route("Inventory/GetBom")]
        public BomQueryResponse GetBom([FromQuery] BomQueryRequest request)
        {
            var billOfMaterialItems1 = _orderWebService.BillOfMaterialItemsDetails(request.ItemId);
            var billOfMaterialItems11 = billOfMaterialItems1.Result;
            var data = new BomQuery { BillOfMaterialItems = billOfMaterialItems11.ToArray() };
            return new BomQueryResponse {  Data = data };
        }     
    }
}
