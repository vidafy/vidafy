using DirectScale.Disco.Extension.Middleware;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ExampleController : ControllerBase
    {
        [HttpGet]
        [Route("test/GetHello")]
        public async Task<ActionResult> TestEndpoint()
        {
          return await Task.Run(() => (Ok("Hello World!")));
        }
    }
}
