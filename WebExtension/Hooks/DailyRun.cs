using DirectScale.Disco.Extension.Hooks;
using DirectScale.Disco.Extension.Hooks.Autoships;
using System;
using System.Threading.Tasks;
using WebExtension.Repositories;
using WebExtension.Services.DailyRun;
using WebExtension.Services.ZiplingoEngagementService;

namespace WebExtension.Hooks
{
    public class DailyRun : IHook<DailyRunHookRequest, DailyRunHookResponse>
    {
        private readonly IZiplingoEngagementService _ziplingoEngagementService;
        private readonly IDailyRunService _dailyRunService;
        private readonly ICustomLogRepository _customLogRepository;

        public DailyRun(IZiplingoEngagementService ziplingoEngagementService, IDailyRunService dailyRunService, ICustomLogRepository customLogRepository)
        {
            _ziplingoEngagementService = ziplingoEngagementService ?? throw new ArgumentNullException(nameof(ziplingoEngagementService));
            _dailyRunService = dailyRunService ?? throw new ArgumentNullException(nameof(dailyRunService));
            _customLogRepository = customLogRepository ?? throw new ArgumentNullException(nameof(customLogRepository));
        }
        public async Task<DailyRunHookResponse> Invoke(DailyRunHookRequest request, Func<DailyRunHookRequest, Task<DailyRunHookResponse>> func)
        {
            var result = await func(request);
            try
            {
                _ziplingoEngagementService.AssociateBirthDateTrigger();
                _ziplingoEngagementService.AssociateWorkAnniversaryTrigger();
                _dailyRunService.FiveDayRun();
                _dailyRunService.SentNotificationOnCardExpiryBefore30Days();
                _dailyRunService.ExecuteCommissionEarned();
            }
            catch (Exception ex)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in daily run hook",ex.Message);
            }
            return result;
        }
    }
}