using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Helper.Models;

namespace WebExtension.Helper
{
    public static class CommonMethod
    {
        public static IEnumerable<List<T>> SplitList<T>(List<T> locations, int nSize = 30)
        {
            for (int i = 0; i < locations.Count; i += nSize)
            {
                yield return locations.GetRange(i, Math.Min(nSize, locations.Count - i));
            }
        }
    }
    public class Responses : Controller
    {
        public IActionResult OkResult(object obj = null)
        {
            APIResponse response = new APIResponse();
            response.Status = Ok().StatusCode.ToString();
            response.Data = obj;
            response.Message = APIResponseMessage.Success;
            return Ok(response);

        }

        public IActionResult BadRequestResult(object obj = null)
        {
            APIResponse response = new APIResponse();
            response.Status = BadRequest().StatusCode.ToString();
            response.Message = APIResponseMessage.Fail;
            response.Error = obj != null ? obj.ToString() : "";
            return BadRequest(response);

        }
        public IActionResult NotFoundResult(object obj = null)
        {
            APIResponse response = new APIResponse();
            response.Status = NotFound().StatusCode.ToString();
            response.Message = APIResponseMessage.Fail;
            response.Error = obj != null ? obj.ToString() : "";
            return NotFound(response);

        }
    }
}

