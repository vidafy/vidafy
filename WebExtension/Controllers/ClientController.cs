﻿using Microsoft.AspNetCore.Mvc;
using System;
using System.Web.Http;
using WebExtension.Helper;
using WebExtension.Models;
using WebExtension.Services;

namespace WebExtension.Controllers
{
    [System.Web.Http.Route("Command/[controller]")]
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


        [System.Web.Http.HttpPost]
        [System.Web.Http.Route("Inventory/GetBom")]
        public IHttpActionResult GetBom([System.Web.Http.FromBody] BomQueryRequest request)
        {
            BomQueryResponse model = new BomQueryResponse();
            try
            {
                var billOfMaterialItems1 = _orderWebService.BillOfMaterialItemsDetails(request.ItemId);
                var billOfMaterialItems11 = billOfMaterialItems1.Result;
                model.Data = new BomQuery { BillOfMaterialItems = billOfMaterialItems11.ToArray() };
                
                //return new Responses().OkResult(model);
            }
            catch (Exception ex)
            {
                model.Message = ex.Message;
                model.Status = 350;
                //return new Responses().BadRequestResult(model);
            }
            return (IHttpActionResult)Ok(model);
        }
    }
}
