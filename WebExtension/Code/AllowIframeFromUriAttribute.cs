using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WebExtension.Code
{
    public class AllowIframeFromUriAttribute : ActionFilterAttribute
    {
        public override void OnResultExecuted(ResultExecutedContext filterContext)
        {
            if (filterContext != null && filterContext.HttpContext != null && filterContext.HttpContext.Response != null && filterContext.HttpContext.Response.Headers != null)
            {
                //AntiForgery was causing issues for cloudspark this removes x-frame: sameorigin header
                //Mainly only needed when a view (iframe) will be called by cloudspark and uses @Html.AntiForgeryToken()
                filterContext.HttpContext.Response.Headers.Remove("Content-Security-Policy");
                filterContext.HttpContext.Response.Headers.Remove("X-XSS-Protection");
                filterContext.HttpContext.Response.Headers.Remove("X-Frame-Options");
            }
            base.OnResultExecuted(filterContext);
        }
    }
}
