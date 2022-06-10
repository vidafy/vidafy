using Microsoft.AspNetCore.Mvc.Filters;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Helper
{
    public class AllowCrossSiteIFrameAttribute : ActionFilterAttribute
    {
        public override void OnResultExecuted(ResultExecutedContext filterContext)
        {
            filterContext.HttpContext.Response.Headers.Remove("X-Frame-Options");
            filterContext.HttpContext.Response.Headers.Add("X-Frame-Options", "ALLOW-FROM https://vidafy.clientextension.directscalestage.com");
            base.OnResultExecuted(filterContext);
        }
    }
}
