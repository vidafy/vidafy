using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Services.ZiplingoEngagementService;

namespace WebExtension.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomApiController : ControllerBase
    {
        private readonly IZiplingoEngagementService _ziplingoEngagementService;

        public CustomApiController(IZiplingoEngagementService ziplingoEngagementService)
        {
            _ziplingoEngagementService = ziplingoEngagementService;
        }

        [HttpPost]
        [Route("testapi")]
        public IActionResult TestCommissionApi()
        {
            try
            {
                var resp = _ziplingoEngagementService.ExecuteCommissionEarned();
                return Ok(resp);
            }
            catch(Exception ex)
            {
                return NotFound(ex);
            }
        }
    }
}
