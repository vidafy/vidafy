using DirectScale.Disco.Extension.EventModels;
using DirectScale.Disco.Extension.Middleware;
using DirectScale.Disco.Extension.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using WebExtension.Services.ZiplingoEngagementService;

namespace WebExtension.Controllers.WebHooks
{
    [ExtensionAuthorize]
    [Route("api/webhooks/Associate")]
    [ApiController]
    public class AssociateWebHooksController : ControllerBase
    {
        private readonly IAssociateService _associateService;
        private readonly IZiplingoEngagementService _engagementService;

        public AssociateWebHooksController(IAssociateService associateService, IZiplingoEngagementService engagementService)
        {
            _associateService = associateService ?? throw new ArgumentNullException(nameof(associateService));
            _engagementService = engagementService ?? throw new ArgumentNullException(nameof(engagementService));
        }

        [HttpPost("UpdateAssociate")]
        public async Task<ActionResult> UpdateAssociateWebHook([FromBody] UpdateAssociateEvent request)
        {
            var associate = await _associateService.GetAssociate(request.AssociateId);
            _engagementService.UpdateContact(associate);

            return Ok();
        }
    }
}
