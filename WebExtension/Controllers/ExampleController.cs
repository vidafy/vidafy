using DirectScale.Disco.Extension.Middleware;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Controllers
{
    [ExtensionAuthorize]
    [Route("api/example")]
    [ApiController]
    public class ExampleController : ControllerBase
    {
        [HttpPost("testEndpoint")]
        public async Task<ActionResult> TestEndpoint()
        {
          return await Task.Run(() => (Ok("Hello World!")));
        }
    }
}
