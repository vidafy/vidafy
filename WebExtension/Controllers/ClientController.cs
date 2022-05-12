using Dapper;
using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Helper;
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


        //[HttpGet]
        //[Route("Inventory/GetBom")]
        //public BomQueryResponse GetBom([FromQuery] BomQueryRequest request)
        //{
        //    var billOfMaterialItems1 = _orderWebService.BillOfMaterialItemsDetails(request.ItemId);
        //    var billOfMaterialItems11 = billOfMaterialItems1.Result;
        //    var data = new BomQuery { BillOfMaterialItems = billOfMaterialItems11.ToArray() };
        //    return new BomQueryResponse {  Data = data };
        //}


        [HttpPost]
        [Route("Inventory/GetBom")]
        public IActionResult GetBom([FromBody] BomQueryRequest request)
        {
            BomQuery model = new BomQuery();
            try
            {
                var billOfMaterialItems = _orderWebService.BillOfMaterialItemsDetails(request.ItemId);
                var billOfMaterialItemsDetails = billOfMaterialItems.Result;
                if (billOfMaterialItemsDetails != null)
                    model.BillOfMaterialItems = billOfMaterialItemsDetails;
                return new Responses().OkResult(model);
            }
            catch (Exception ex)
            {
                return new Responses().BadRequestResult(model);
            }
        }
    }
}
