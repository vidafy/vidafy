using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Helper;
using WebExtension.Helper.Interface;
using WebExtension.Helper.Models;
using WebExtension.Models;
using WebExtension.Services;

namespace WebExtension.Controllers
{
    [Route("api/[controller]")]
    public class OrderController : Controller
    {
        private configSetting _config;

        [ViewData]
        public string DSBaseUrl { get; set; }
        //
        private readonly ICurrentUser _currentUser;
        private readonly ISettingsService _settingsService;
        //
        private readonly ICommonService _commonService;
        //
        private readonly ICountryService _countryService;
        //
        private readonly IOrderWebService _orderWebService;
        public OrderController(IOptions<configSetting> config,
            ICurrentUser currentUser, ISettingsService settingsService,
            ICommonService commonService,
            ICountryService countryService,
            IOrderWebService orderWebService
        )
        {
            _config = config.Value;
            //
            _currentUser = currentUser ?? throw new ArgumentNullException(nameof(currentUser));
            _settingsService = settingsService ?? throw new ArgumentNullException(nameof(settingsService));
            //
            DirectScale.Disco.Extension.ExtensionContext extension = _settingsService.ExtensionContext().Result;
            DSBaseUrl = _config.BaseURL.Replace("{clientId}", extension.ClientId).Replace("{environment}", extension.EnvironmentType == EnvironmentType.Live ? "" : "stage");
            //
            _commonService = commonService ?? throw new ArgumentNullException(nameof(commonService));
            //
            _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
            //
            _orderWebService = orderWebService ?? throw new ArgumentNullException(nameof(orderWebService));
        }

        [HttpPost]
        [Route("GetCustomOrderReport")]
        public IActionResult GetCustomOrderReport([FromBody] GetCustomOrderReportRequest request)
        {
            try
            {
                CustomOrderReportResponse model = new CustomOrderReportResponse();

                model.search = request?.search ?? "";
                CultureInfo provider = CultureInfo.InvariantCulture;
                model.begin = !string.IsNullOrEmpty(request?.begin) ? DateTime.ParseExact(request?.begin, DateTimeFormat.GetDateTimeFormat, provider, DateTimeStyles.None) : System.DateTime.Now.AddMonths(-1);
                model.end = !string.IsNullOrEmpty(request?.end) ? DateTime.ParseExact(request?.end, DateTimeFormat.GetDateTimeFormat, provider, DateTimeStyles.None) : System.DateTime.Now;
                model.orders = _orderWebService.GetFilteredOrders(model.search, model.begin, model.end).Result;
                return new Responses().OkResult(model);
            }
            catch (Exception ex)
            {
                return new Responses().BadRequestResult(ex.Message);
            }
        }
    }
}
