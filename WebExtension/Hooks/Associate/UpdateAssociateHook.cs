using DirectScale.Disco.Extension.Hooks;
using DirectScale.Disco.Extension.Hooks.Associates;
using DirectScale.Disco.Extension.Services;
using System;
using System.Threading.Tasks;
using WebExtension.Services.ZiplingoEngagementService;

namespace WebExtension.Hooks.Associate
{
    public class UpdateAssociateHook : IHook<UpdateAssociateHookRequest, UpdateAssociateHookResponse>
    {
        private readonly IZiplingoEngagementService _ziplingoEngagementService;
        private readonly IAssociateService _associateService;

        public UpdateAssociateHook(IZiplingoEngagementService ziplingoEngagementService, IAssociateService associateService)
        {
            _ziplingoEngagementService = ziplingoEngagementService ?? throw new ArgumentNullException(nameof(ziplingoEngagementService));
            _associateService = associateService ?? throw new ArgumentNullException(nameof(associateService));
        }

        public async Task<UpdateAssociateHookResponse> Invoke(UpdateAssociateHookRequest request, Func<UpdateAssociateHookRequest, Task<UpdateAssociateHookResponse>> func)
        {
            if (request.OldAssociateInfo.AssociateBaseType != request.UpdatedAssociateInfo.AssociateBaseType)
            {
                // Call AssociateTypeChange Trigger
                if (request.OldAssociateInfo.AssociateBaseType > 0 && request.UpdatedAssociateInfo.AssociateBaseType > 0)
                {
                    var OldAssociateType = await _associateService.GetAssociateTypeName(request.OldAssociateInfo.AssociateBaseType);
                    var UpdatedAssociateType = await _associateService.GetAssociateTypeName(request.UpdatedAssociateInfo.AssociateBaseType);
                     _ziplingoEngagementService.UpdateAssociateType(request.UpdatedAssociateInfo.AssociateId, OldAssociateType, UpdatedAssociateType);
                }
            }
            var result = func(request);
            var associate = await _associateService.GetAssociate(request.UpdatedAssociateInfo.AssociateId);
            _ziplingoEngagementService.UpdateContact(associate);
            return await result;
        }
    }
}
