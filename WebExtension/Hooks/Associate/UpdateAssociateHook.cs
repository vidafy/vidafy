using DirectScale.Disco.Extension;
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
        private readonly ITreeService _treeService;
        private readonly ITicketService _ticketService;

        public UpdateAssociateHook(IZiplingoEngagementService ziplingoEngagementService, IAssociateService associateService, ITreeService treeService, ITicketService ticketService)
        {
            _ziplingoEngagementService = ziplingoEngagementService ?? throw new ArgumentNullException(nameof(ziplingoEngagementService));
            _associateService = associateService ?? throw new ArgumentNullException(nameof(associateService));
            _treeService = treeService ?? throw new ArgumentNullException(nameof(treeService));
            _ticketService = ticketService ?? throw new ArgumentNullException(nameof(ticketService));
        }

        public async Task<UpdateAssociateHookResponse> Invoke(UpdateAssociateHookRequest request, Func<UpdateAssociateHookRequest, Task<UpdateAssociateHookResponse>> func)
        {
            var result = func(request);

            var _oldAssociateType = request.OldAssociateInfo.AssociateBaseType;
            var _newAssociateType = request.UpdatedAssociateInfo.AssociateBaseType;

            if (_oldAssociateType != _newAssociateType)
            {
                // Place the updated user in the Unilevel tree if their type changed.
                if (_newAssociateType == 1 && (_oldAssociateType == 2 || _oldAssociateType == 3))
                {
                    PlaceAssociateInUnilevelTree(request.UpdatedAssociateInfo.AssociateId);
                }

                // ZL Engagement Service: Call AssociateTypeChange Trigger
                if (_oldAssociateType > 0 && _newAssociateType > 0)
                {
                    var OldAssociateTypeName = await _associateService.GetAssociateTypeName(_oldAssociateType);
                    var UpdatedAssociateTypeName = await _associateService.GetAssociateTypeName(_newAssociateType);
                    _ziplingoEngagementService.UpdateAssociateType(request.UpdatedAssociateInfo.AssociateId, OldAssociateTypeName, UpdatedAssociateTypeName);
                }
            }
            return await result;
        }

        private async void PlaceAssociateInUnilevelTree(int associateId)
        {
            var _nodeId = new NodeId(associateId);
            var unilevelNodeDetail = await _treeService.GetNodeDetail(_nodeId, TreeType.Unilevel);

            if (unilevelNodeDetail != null && unilevelNodeDetail.UplineId != null)
            {
                await _ticketService.LogEvent(associateId, $"Skipping Placement. Already in Unilevel tree under {unilevelNodeDetail.UplineId.AssociateId}.", "", "");
                return;
            }

            var enrollerNodeDetail = await _treeService.GetNodeDetail(_nodeId, TreeType.Enrollment);

            if (enrollerNodeDetail == null || enrollerNodeDetail.UplineId == null)
            {
                await _ticketService.LogEvent(associateId, $"User could not be placed in Unilevel tree because they are not in the Enroller tree.", "", "");
            }

            var uplineId = enrollerNodeDetail.UplineId;

            try
            {
                await _treeService.ValidatePlacements(
                    new Placement[] {
                            new Placement() {
                                Tree = TreeType.Unilevel,
                                NodeDetail = new NodeDetail() { NodeId = _nodeId, UplineId = uplineId, UplineLeg = LegName.Empty }
                            }
                    });
                await _treeService.Place(new Placement[] {
                        new Placement() {
                            Tree = TreeType.Unilevel,
                            NodeDetail = new NodeDetail() { NodeId = _nodeId, UplineId = uplineId, UplineLeg = LegName.Empty }
                        }
                    });
            }
            catch (Exception e)
            {
                await _ticketService.LogEvent(associateId, $"Unilevel placement failed with upline {uplineId}. Err: {e.Message}", "", "");
            }
        }
    }
}
