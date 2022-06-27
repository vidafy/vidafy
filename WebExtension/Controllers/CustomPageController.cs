﻿using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Middleware;
using DirectScale.Disco.Extension.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Helper.Interface;
using WebExtension.Helper.Models;
using WebExtension.Services.ZiplingoEngagementService;
using WebExtension.Services.ZiplingoEngagementService.Model;

namespace WebExtension.Controllers
{
    public class CustomPageController : Controller
    {
        private configSetting _config;

        [ViewData]
        public string DSBaseUrl { get; set; }
        //
        private readonly ICurrentUser _currentUser;
        private readonly ISettingsService _settingsService;
        //
        private readonly IAssociateService _associateService;
        private readonly IOrderService _orderService;
        private readonly ICouponService _couponService;
        private readonly ICurrencyService _currencyService;
        private readonly ICountryService _countryService;
        //
        private readonly ICommonService _commonService;
        private readonly IZiplingoEngagementRepository _ziplingoEngagementRepository;
        //
        public CustomPageController(IOptions<configSetting> config,
            ICurrentUser currentUser, ISettingsService settingsService,
            IAssociateService associateService, IOrderService orderService,
            ICouponService couponService, ICurrencyService currencyService,
            ICountryService countryService,
            ICommonService commonService,
            IZiplingoEngagementRepository ziplingoEngagementRepository
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
            _associateService = associateService ?? throw new ArgumentNullException(nameof(associateService));
            _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
            _couponService = couponService ?? throw new ArgumentNullException(nameof(couponService));
            _currencyService = currencyService ?? throw new ArgumentNullException(nameof(currencyService));
            _countryService = countryService ?? throw new ArgumentNullException(nameof(countryService));
            //
            _commonService = commonService ?? throw new ArgumentNullException(nameof(commonService));
            //
            _ziplingoEngagementRepository = ziplingoEngagementRepository ?? throw new ArgumentNullException(nameof(ziplingoEngagementRepository));

        }

        [ExtensionAuthorize]
        public async Task<IActionResult> CustomOrderReport()
        {
            return View();
        }

        public IActionResult ZiplingoEngagementSetting()
        {
            ZiplingoEngagementSettings _settings = _ziplingoEngagementRepository.GetSettings();
            List<ZiplingoEventSettings> _eventSettings = _ziplingoEngagementRepository.GetEventSettingsList();
            resObj viewDataSend = new resObj() { settings = _settings, eventSettings = _eventSettings };
            ViewBag.Message = viewDataSend;
            return View();
        }

        public IActionResult EWalletSettings()
        {
            var ewalletSetting = _ziplingoEngagementRepository.GetEWalletSetting();
            ViewBag.Message = ewalletSetting;
            return View();
        }
    }
    public class resObj
    {
        public ZiplingoEngagementSettings settings { get; set; }
        public List<ZiplingoEventSettings> eventSettings { get; set; }
    }
}
