﻿using Newtonsoft.Json;
using System;
using System.Linq;
using WebExtension.Services.ZiplingoEngagementService.Model;
using WebExtension.Services.ZiplingoEngagement.Model;
using DirectScale.Disco.Extension.Services;
using DirectScale.Disco.Extension;
using System.Collections.Generic;
using DirectScale.Disco.Extension.Hooks.Commissions;
using RestSharp;
using RestSharp.Authenticators;
using System.Net;
using System.Net.Security;
using WebExtension.Repositories;

namespace WebExtension.Services.ZiplingoEngagementService
{
    public interface IZiplingoEngagementService
    {
        void CallOrderZiplingoEngagementTrigger(Order order, string eventKey, bool FailedAutoship);
        void CreateEnrollContact(Order order);
        void CreateContact(Application req, ApplicationResponse response);
        void UpdateContact(Associate req);
        void ResetSettings(CommandRequest commandRequest);
        void SendOrderShippedEmail(int packageId, string trackingNumber);
        void AssociateBirthDateTrigger();
        void AssociateWorkAnniversaryTrigger();
        EmailOnNotificationEvent OnNotificationEvent(NotificationEvent notification);
        void FiveDayRunTrigger(List<AutoshipInfo> autoships);
        void AssociateStatusChangeTrigger(int associateId, int oldStatusId, int newStatusId);
        void ExpirationCardTrigger(List<CardInfo> cardinfo);
        LogRealtimeRankAdvanceHookResponse LogRealtimeRankAdvanceEvent(LogRealtimeRankAdvanceHookRequest req);
        void UpdateAssociateType(int associateId, string oldAssociateType, string newAssociateType);
        void ExecuteCommissionEarned();
    }
    public class ZiplingoEngagementService : IZiplingoEngagementService
    {
        private readonly IZiplingoEngagementRepository _ZiplingoEngagementRepository;
        private readonly ICompanyService _companyService;
        private readonly ICustomLogRepository _customLogRepository;
        private static readonly string ClassName = typeof(ZiplingoEngagementService).FullName;
        private readonly IOrderService _orderService;
        private readonly IAssociateService _distributorService;
        private readonly ITreeService _treeService;
        private readonly IRankService _rankService;
        private readonly IPaymentProcessingService _paymentProcessingService;

        public ZiplingoEngagementService(IZiplingoEngagementRepository repository, 
            ICompanyService companyService,
            ICustomLogRepository customLogRepository, 
            IOrderService orderService, 
            IAssociateService distributorService, 
            ITreeService treeService, 
            IRankService rankService,
            IPaymentProcessingService paymentProcessingService
            )
        {
            _ZiplingoEngagementRepository = repository ?? throw new ArgumentNullException(nameof(repository));
            _companyService = companyService ?? throw new ArgumentNullException(nameof(companyService));
            _customLogRepository = customLogRepository ?? throw new ArgumentNullException(nameof(customLogRepository));
            _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
            _distributorService = distributorService ?? throw new ArgumentNullException(nameof(distributorService));
            _treeService = treeService ?? throw new ArgumentNullException(nameof(treeService));
            _rankService = rankService ?? throw new ArgumentNullException(nameof(rankService));
            _paymentProcessingService = paymentProcessingService ?? throw new ArgumentNullException(nameof(paymentProcessingService));
        }

        public async void CallOrderZiplingoEngagementTrigger(Order order, string eventKey, bool FailedAutoship)
        {
            try
            {
                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    var company = _companyService.GetCompany();
                    var settings = _ZiplingoEngagementRepository.GetSettings();
                    int enrollerID = 0;
                    int sponsorID = 0;
                    if (_treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                    {
                        enrollerID = _treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                    }
                    if (_treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                    {
                        sponsorID = _treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                    }

                    Associate sponsorSummary = new Associate();
                    Associate enrollerSummary = new Associate();
                    if (enrollerID <= 0)
                    {
                        enrollerSummary = new Associate();
                    }
                    else
                    {
                        enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                    }
                    if (sponsorID > 0)
                    {
                        sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                    }
                    else
                    {
                        sponsorSummary = enrollerSummary;
                    }
                    var CardLastFourDegit = _ZiplingoEngagementRepository.GetLastFoutDegitByOrderNumber(order.OrderNumber);
                    OrderData data = new OrderData
                    {
                        AssociateId = order.AssociateId,
                        BackofficeId = order.BackofficeId,
                        Email = order.Email,
                        InvoiceDate = order.InvoiceDate,
                        IsPaid = order.IsPaid,
                        LocalInvoiceNumber = order.LocalInvoiceNumber,
                        Name = order.Name,
                        Phone = order.BillPhone,
                        OrderDate = order.OrderDate,
                        OrderNumber = order.OrderNumber,
                        OrderType = order.OrderType,
                        Tax = order.Totals.Select(m => m.Tax).FirstOrDefault(),
                        ShipCost = order.Totals.Select(m => m.Shipping).FirstOrDefault(),
                        Subtotal = order.Totals.Select(m => m.SubTotal).FirstOrDefault(),
                        USDTotal = order.USDTotal,
                        Total = order.Totals.Select(m => m.Total).FirstOrDefault(),
                        PaymentMethod = CardLastFourDegit,
                        ProductInfo = order.LineItems,
                        ProductNames = string.Join(",", order.LineItems.Select(x => x.ProductName).ToArray()),
                        ErrorDetails = FailedAutoship ? order.Payments.FirstOrDefault().PaymentResponse.ToString() : "",
                        CompanyDomain = company.Result.BackOfficeHomePageURL,
                        LogoUrl = settings.LogoUrl,
                        CompanyName = settings.CompanyName,
                        EnrollerId = enrollerSummary.AssociateId,
                        SponsorId = sponsorSummary.AssociateId,
                        EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                        EnrollerMobile = enrollerSummary.PrimaryPhone,
                        EnrollerEmail = enrollerSummary.EmailAddress,
                        SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                        SponsorMobile = sponsorSummary.PrimaryPhone,
                        SponsorEmail = sponsorSummary.EmailAddress,
                        BillingAddress = order.BillAddress,
                        ShippingAddress = order.Packages?.FirstOrDefault()?.ShippingAddress
                    };
                    var strData = JsonConvert.SerializeObject(data);
                    ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = order.AssociateId, companyname = settings.CompanyName, eventKey = eventKey, data = strData };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0,0,"Error with in :"+eventKey, e.Message);
            }
        }

        public async void CallOrderZiplingoEngagementTriggerForShipped(OrderDetailModel order, string eventKey, bool FailedAutoship = false)
        {
            try
            {
                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    var company = _companyService.GetCompany();
                    var settings = _ZiplingoEngagementRepository.GetSettings();
                    int enrollerID = 0;
                    int sponsorID = 0;
                    if (_treeService.GetNodeDetail(new NodeId(order.Order.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                    {
                        enrollerID = _treeService.GetNodeDetail(new NodeId(order.Order.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                    }
                    if (_treeService.GetNodeDetail(new NodeId(order.Order.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                    {
                        sponsorID = _treeService.GetNodeDetail(new NodeId(order.Order.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                    }

                    Associate sponsorSummary = new Associate();
                    Associate enrollerSummary = new Associate();
                    if (enrollerID <= 0)
                    {
                        enrollerSummary = new Associate();
                    }
                    else
                    {
                        enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                    }
                    if (sponsorID > 0)
                    {
                        sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                    }
                    else
                    {
                        sponsorSummary = enrollerSummary;
                    }
                    var CardLastFourDegit = _ZiplingoEngagementRepository.GetLastFoutDegitByOrderNumber(order.Order.OrderNumber);
                    OrderData data = new OrderData
                    {
                        AssociateId = order.Order.AssociateId,
                        BackofficeId = order.Order.BackofficeId,
                        Email = order.Order.Email,
                        InvoiceDate = order.Order.InvoiceDate,
                        IsPaid = order.Order.IsPaid,
                        LocalInvoiceNumber = order.Order.LocalInvoiceNumber,
                        Name = order.Order.Name,
                        Phone = order.Order.BillPhone,
                        OrderDate = order.Order.OrderDate,
                        OrderNumber = order.Order.OrderNumber,
                        OrderType = order.Order.OrderType,
                        Tax = order.Order.Totals.Select(m => m.Tax).FirstOrDefault(),
                        ShipCost = order.Order.Totals.Select(m => m.Shipping).FirstOrDefault(),
                        Subtotal = order.Order.Totals.Select(m => m.SubTotal).FirstOrDefault(),
                        USDTotal = order.Order.USDTotal,
                        Total = order.Order.Totals.Select(m => m.Total).FirstOrDefault(),
                        PaymentMethod = CardLastFourDegit,
                        ProductInfo = order.Order.LineItems,
                        ProductNames = string.Join(",", order.Order.LineItems.Select(x => x.ProductName).ToArray()),
                        ErrorDetails = FailedAutoship ? order.Order.Payments.FirstOrDefault().PaymentResponse.ToString() : "",
                        CompanyDomain = company.Result.BackOfficeHomePageURL,
                        LogoUrl = settings.LogoUrl,
                        TrackingNumber = order.TrackingNumber,
                        Carrier = order.Carrier,
                        DateShipped = order.DateShipped,
                        CompanyName = settings.CompanyName,
                        EnrollerId = enrollerSummary.AssociateId,
                        SponsorId = sponsorSummary.AssociateId,
                        AutoshipId = order.AutoshipId,
                        EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                        EnrollerMobile = enrollerSummary.PrimaryPhone,
                        EnrollerEmail = enrollerSummary.EmailAddress,
                        SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                        SponsorMobile = sponsorSummary.PrimaryPhone,
                        SponsorEmail = sponsorSummary.EmailAddress,
                        BillingAddress = order.Order.BillAddress,
                        ShippingAddress = order.Order.Packages?.FirstOrDefault()?.ShippingAddress
                    };
                    var strData = JsonConvert.SerializeObject(data);
                    ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = order.Order.AssociateId, companyname = settings.CompanyName, eventKey = eventKey, data = strData };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in :" + eventKey, e.Message);
            }
        }

        public async void CallOrderZiplingoEngagementTriggerListForBirthDayWishes(List<AssociateInfoList> assoInfo, string eventKey)
        {
            try
            {
                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    var company = _companyService.GetCompany();
                    var settings = _ZiplingoEngagementRepository.GetSettings();
                    List<AssociateDetail> objassoListDetail = new List<AssociateDetail>();
                    foreach (var assodetail in assoInfo)
                    {
                        AssociateDetail objassDetail = new AssociateDetail();
                        int enrollerID = 0;
                        int sponsorID = 0;
                        if (_treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                        {
                            enrollerID = _treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                        }
                        if (_treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                        {
                            sponsorID = _treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                        }

                        Associate sponsorSummary = new Associate();
                        Associate enrollerSummary = new Associate();
                        if (enrollerID <= 0)
                        {
                            enrollerSummary = new Associate();
                        }
                        else
                        {
                            enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                        }
                        if (sponsorID > 0)
                        {
                            sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                        }
                        else
                        {
                            sponsorSummary = enrollerSummary;
                        }
                        AssociateInfo data = new AssociateInfo
                        {
                            AssociateId = assodetail.AssociateId,
                            EmailAddress = assodetail.EmailAddress,
                            Birthdate = assodetail.Birthdate,
                            FirstName = assodetail.FirstName,
                            LastName = assodetail.LastName,
                            CompanyDomain = company.Result.BackOfficeHomePageURL,
                            LogoUrl = settings.LogoUrl,
                            CompanyName = settings.CompanyName,
                            EnrollerId = enrollerSummary.AssociateId,
                            SponsorId = sponsorSummary.AssociateId,
                            CommissionActive = true,
                            EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                            EnrollerMobile = enrollerSummary.PrimaryPhone,
                            EnrollerEmail = enrollerSummary.EmailAddress,
                            SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                            SponsorMobile = sponsorSummary.PrimaryPhone,
                            SponsorEmail = sponsorSummary.EmailAddress
                        };
                        objassDetail.associateId = assodetail.AssociateId;
                        objassDetail.data = JsonConvert.SerializeObject(data);
                        objassoListDetail.Add(objassDetail);
                    }

                    var strData = objassoListDetail;
                    ZiplingoEngagementListRequest request = new ZiplingoEngagementListRequest { companyname = settings.CompanyName, eventKey = eventKey, dataList = strData };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTriggersList");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in :" + eventKey, e.Message);
            }
        }

        public async void CallOrderZiplingoEngagementTriggerListForWorkAnniversary(List<AssociateWorkAnniversaryInfoList> assoList, string eventKey)
        {
            try
            {
                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    var company = _companyService.GetCompany();
                    var settings = _ZiplingoEngagementRepository.GetSettings();
                    List<AssociateDetail> objassoListDetail = new List<AssociateDetail>();
                    foreach (var assodetail in assoList)
                    {
                        AssociateDetail objassDetail = new AssociateDetail();
                        int enrollerID = 0;
                        int sponsorID = 0;
                        if (_treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                        {
                            enrollerID = _treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                        }
                        if (_treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                        {
                            sponsorID = _treeService.GetNodeDetail(new NodeId(assodetail.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                        }

                        Associate sponsorSummary = new Associate();
                        Associate enrollerSummary = new Associate();
                        if (enrollerID <= 0)
                        {
                            enrollerSummary = new Associate();
                        }
                        else
                        {
                            enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                        }
                        if (sponsorID > 0)
                        {
                            sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                        }
                        else
                        {
                            sponsorSummary = enrollerSummary;
                        }
                        AssociateInfo data = new AssociateInfo
                        {
                            AssociateId = assodetail.AssociateId,
                            EmailAddress = assodetail.EmailAddress,
                            SignupDate = assodetail.SignupDate,
                            TotalWorkingYears = assodetail.TotalWorkingYears,
                            FirstName = assodetail.FirstName,
                            LastName = assodetail.LastName,
                            CompanyDomain = company.Result.BackOfficeHomePageURL,
                            LogoUrl = settings.LogoUrl,
                            CompanyName = settings.CompanyName,
                            EnrollerId = enrollerSummary.AssociateId,
                            SponsorId = sponsorSummary.AssociateId,
                            CommissionActive = true,
                            EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                            EnrollerMobile = enrollerSummary.PrimaryPhone,
                            EnrollerEmail = enrollerSummary.EmailAddress,
                            SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                            SponsorMobile = sponsorSummary.PrimaryPhone,
                            SponsorEmail = sponsorSummary.EmailAddress
                        };
                        objassDetail.associateId = assodetail.AssociateId;
                        objassDetail.data = JsonConvert.SerializeObject(data);
                        objassoListDetail.Add(objassDetail);
                    }
                    var strData = objassoListDetail;
                    ZiplingoEngagementListRequest request = new ZiplingoEngagementListRequest { companyname = settings.CompanyName, eventKey = eventKey, dataList = strData };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTriggersList");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in :" + eventKey, e.Message);
            }
        }

        public async void CallOrderZiplingoEngagementTriggerForAssociateRankAdvancement(AssociateRankAdvancement assoRankAdvancementInfo, string eventKey)
        {
            try
            {
                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    var company = _companyService.GetCompany();
                    var settings = _ZiplingoEngagementRepository.GetSettings();
                    int enrollerID = 0;
                    int sponsorID = 0;
                    if (_treeService.GetNodeDetail(new NodeId(assoRankAdvancementInfo.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                    {
                        enrollerID = _treeService.GetNodeDetail(new NodeId(assoRankAdvancementInfo.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                    }
                    if (_treeService.GetNodeDetail(new NodeId(assoRankAdvancementInfo.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                    {
                        sponsorID = _treeService.GetNodeDetail(new NodeId(assoRankAdvancementInfo.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                    }

                    Associate sponsorSummary = new Associate();
                    Associate enrollerSummary = new Associate();
                    if (enrollerID <= 0)
                    {
                        enrollerSummary = new Associate();
                    }
                    else
                    {
                        enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                    }
                    if (sponsorID > 0)
                    {
                        sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                    }
                    else
                    {
                        sponsorSummary = enrollerSummary;
                    }
                    AssociateRankAdvancement data = new AssociateRankAdvancement
                    {
                        Rank = assoRankAdvancementInfo.Rank,
                        AssociateId = assoRankAdvancementInfo.AssociateId,
                        FirstName = assoRankAdvancementInfo.FirstName,
                        LastName = assoRankAdvancementInfo.LastName,
                        CompanyDomain = company.Result.BackOfficeHomePageURL,
                        LogoUrl = settings.LogoUrl,
                        CompanyName = settings.CompanyName,
                        EnrollerId = enrollerSummary.AssociateId,
                        SponsorId = sponsorSummary.AssociateId,
                        RankName = assoRankAdvancementInfo.RankName,
                        CommissionActive = true,
                        EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                        EnrollerMobile = enrollerSummary.PrimaryPhone,
                        EnrollerEmail = enrollerSummary.EmailAddress,
                        SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                        SponsorMobile = sponsorSummary.PrimaryPhone,
                        SponsorEmail = sponsorSummary.EmailAddress
                    };
                    var strData = JsonConvert.SerializeObject(data);
                    ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = assoRankAdvancementInfo.AssociateId, companyname = settings.CompanyName, eventKey = eventKey, data = strData };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in :" + eventKey, e.Message);
            }
        }

        public async void CallOrderZiplingoEngagementTriggerForAssociateChangeStatus(AssociateStatusChange assoStatusChangeInfo, string eventKey)
        {
            try
            {
                var company = _companyService.GetCompany();
                var settings = _ZiplingoEngagementRepository.GetSettings();
                var UserName = _ZiplingoEngagementRepository.GetUsernameById(Convert.ToString(assoStatusChangeInfo.AssociateId));
                int enrollerID = 0;
                int sponsorID = 0;
                if (_treeService.GetNodeDetail(new NodeId(assoStatusChangeInfo.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                {
                    enrollerID = _treeService.GetNodeDetail(new NodeId(assoStatusChangeInfo.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                }
                if (_treeService.GetNodeDetail(new NodeId(assoStatusChangeInfo.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                {
                    sponsorID = _treeService.GetNodeDetail(new NodeId(assoStatusChangeInfo.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                }

                Associate sponsorSummary = new Associate();
                Associate enrollerSummary = new Associate();
                if (enrollerID <= 0)
                {
                    enrollerSummary = new Associate();
                }
                else
                {
                    enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                }
                if (sponsorID > 0)
                {
                    sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                }
                else
                {
                    sponsorSummary = enrollerSummary;
                }
                AssociateStatusChange data = new AssociateStatusChange
                {
                    OldStatusId = assoStatusChangeInfo.OldStatusId,
                    OldStatus = assoStatusChangeInfo.OldStatus,
                    NewStatusId = assoStatusChangeInfo.NewStatusId,
                    NewStatus = assoStatusChangeInfo.NewStatus,
                    AssociateId = assoStatusChangeInfo.AssociateId,
                    FirstName = assoStatusChangeInfo.FirstName,
                    LastName = assoStatusChangeInfo.LastName,
                    CompanyDomain = company.Result.BackOfficeHomePageURL,
                    LogoUrl = settings.LogoUrl,
                    CompanyName = settings.CompanyName,
                    EnrollerId = enrollerSummary.AssociateId,
                    SponsorId = sponsorSummary.AssociateId,
                    EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                    EnrollerMobile = enrollerSummary.PrimaryPhone,
                    EnrollerEmail = enrollerSummary.EmailAddress,
                    SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                    SponsorMobile = sponsorSummary.PrimaryPhone,
                    SponsorEmail = sponsorSummary.EmailAddress,
                    EmailAddress = assoStatusChangeInfo.EmailAddress,
                    WebAlias = UserName
                };
                var strData = JsonConvert.SerializeObject(data);
                ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = assoStatusChangeInfo.AssociateId, companyname = settings.CompanyName, eventKey = eventKey, data = strData, associateStatus = assoStatusChangeInfo.NewStatusId };
                var jsonReq = JsonConvert.SerializeObject(request);
                CallZiplingoEngagementApi(jsonReq, "Campaign/ChangeAssociateStatus");
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in :" + eventKey, e.Message);
            }
        }

        public async void CreateEnrollContact(Order order)
        {
            try
            {
                var company = _companyService.GetCompany();
                var associateInfo = _distributorService.GetAssociate(order.AssociateId);
                var settings = _ZiplingoEngagementRepository.GetSettings();
                var UserName = _ZiplingoEngagementRepository.GetUsernameById(Convert.ToString(order.AssociateId));
                int enrollerID = 0;
                int sponsorID = 0;
                if (_treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                {
                    enrollerID = _treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                }
                if (_treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                {
                    sponsorID = _treeService.GetNodeDetail(new NodeId(order.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                }

                Associate sponsorSummary = new Associate();
                Associate enrollerSummary = new Associate();
                if (enrollerID <= 0)
                {
                    enrollerSummary = new Associate();
                }
                else
                {
                    enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                }
                if (sponsorID > 0)
                {
                    sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                }
                else
                {
                    sponsorSummary = enrollerSummary;
                }
                var ZiplingoEngagementRequest = new AssociateContactModel
                {
                    AssociateId = associateInfo.Result.AssociateId,
                    AssociateType = associateInfo.Result.AssociateBaseType,
                    BackOfficeId = associateInfo.Result.BackOfficeId,
                    firstName = associateInfo.Result.DisplayFirstName,
                    lastName = associateInfo.Result.DisplayLastName,
                    address = associateInfo.Result.Address.AddressLine1 + " " + associateInfo.Result.Address.AddressLine2 + " " + associateInfo.Result.Address.AddressLine3,
                    city = associateInfo.Result.Address.City,
                    birthday = associateInfo.Result.BirthDate,
                    CountryCode = associateInfo.Result.Address.CountryCode,
                    distributerId = associateInfo.Result.BackOfficeId,
                    phoneNumber = associateInfo.Result.TextNumber,
                    region = associateInfo.Result.Address.CountryCode,
                    state = associateInfo.Result.Address.State,
                    zip = associateInfo.Result.Address.PostalCode,
                    UserName = UserName,
                    WebAlias = UserName,
                    CompanyUrl = company.Result.BackOfficeHomePageURL,
                    CompanyDomain = company.Result.BackOfficeHomePageURL,
                    LanguageCode = associateInfo.Result.LanguageCode,
                    CommissionActive = true,
                    emailAddress = associateInfo.Result.EmailAddress,
                    CompanyName = settings.CompanyName,
                    EnrollerId = enrollerSummary.AssociateId,
                    SponsorId = sponsorSummary.AssociateId,
                    EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                    EnrollerMobile = enrollerSummary.PrimaryPhone,
                    EnrollerEmail = enrollerSummary.EmailAddress,
                    SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                    SponsorMobile = sponsorSummary.PrimaryPhone,
                    SponsorEmail = sponsorSummary.EmailAddress
                };

                var jsonZiplingoEngagementRequest = JsonConvert.SerializeObject(ZiplingoEngagementRequest);
                CallZiplingoEngagementApi(jsonZiplingoEngagementRequest, "Contact/CreateContactV2");
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in CreateEnrollContact", e.Message);
            }
        }

        public async void CreateContact(Application req, ApplicationResponse response)
        {
            try
            {
                if (req.AssociateId == 0)
                    req.AssociateId = response.AssociateId;

                if (string.IsNullOrEmpty(req.BackOfficeId))
                    req.BackOfficeId = response.BackOfficeId;

                var company = _companyService.GetCompany();
                var settings = _ZiplingoEngagementRepository.GetSettings();
                int enrollerID = 0;
                int sponsorID = 0;
                if (_treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                {
                    enrollerID = _treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                }
                if (_treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                {
                    sponsorID = _treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                }

                Associate sponsorSummary = new Associate();
                Associate enrollerSummary = new Associate();
                if (enrollerID <= 0)
                {
                    enrollerSummary = new Associate();
                }
                else
                {
                    enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                }
                if (sponsorID > 0)
                {
                    sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                }
                else
                {
                    sponsorSummary = enrollerSummary;
                }
                var ZiplingoEngagementRequest = new AssociateContactModel
                {
                    AssociateId = req.AssociateId,
                    AssociateStatus = req.StatusId,
                    AssociateType = req.AssociateBaseType,
                    BackOfficeId = req.BackOfficeId,
                    birthday = req.BirthDate,
                    address = req.ApplicantAddress.AddressLine1 + " " + req.ApplicantAddress.AddressLine2 + " " + req.ApplicantAddress.AddressLine3,
                    city = req.ApplicantAddress.City,
                    CommissionActive = true,
                    CountryCode = req.ApplicantAddress.CountryCode,
                    distributerId = req.BackOfficeId,
                    emailAddress = req.EmailAddress,
                    firstName = req.FirstName,
                    lastName = req.LastName,
                    phoneNumber = req.TextNumber,
                    region = req.ApplicantAddress.CountryCode,
                    state = req.ApplicantAddress.State,
                    zip = req.ApplicantAddress.PostalCode,
                    UserName = req.Username,
                    WebAlias = req.Username,
                    CompanyUrl = company.Result.BackOfficeHomePageURL,
                    CompanyDomain = company.Result.BackOfficeHomePageURL,
                    LanguageCode = req.LanguageCode,
                    CompanyName = settings.CompanyName,
                    EnrollerId = enrollerSummary.AssociateId,
                    SponsorId = sponsorSummary.AssociateId,
                    EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                    EnrollerMobile = enrollerSummary.PrimaryPhone,
                    EnrollerEmail = enrollerSummary.EmailAddress,
                    SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                    SponsorMobile = sponsorSummary.PrimaryPhone,
                    SponsorEmail = sponsorSummary.EmailAddress
                };

                var jsonZiplingoEngagementRequest = JsonConvert.SerializeObject(ZiplingoEngagementRequest);
                CallZiplingoEngagementApi(jsonZiplingoEngagementRequest, "Contact/CreateContactV2");

                var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail("Enrollment");
                if (eventSetting != null && eventSetting?.Status == true)
                {
                    ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = req.AssociateId, companyname = settings.CompanyName, eventKey = "Enrollment", data = jsonZiplingoEngagementRequest };
                    var jsonReq = JsonConvert.SerializeObject(request);
                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in CreateContact", e.Message);
            }
        }

        public async void UpdateContact(Associate req)
        {
            try
            {
                var settings = _ZiplingoEngagementRepository.GetSettings();
                var company = _companyService.GetCompany();
                var UserName = _ZiplingoEngagementRepository.GetUsernameById(Convert.ToString(req.AssociateId));
                var AssociateInfo = _distributorService.GetAssociate(req.AssociateId);
                int enrollerID = 0;
                int sponsorID = 0;
                if (_treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Enrollment).Result.UplineId != null)
                {
                    enrollerID = _treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Enrollment)?.Result.UplineId.AssociateId ?? 0;
                }
                if (_treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Unilevel).Result.UplineId != null)
                {
                    sponsorID = _treeService.GetNodeDetail(new NodeId(req.AssociateId, 0), TreeType.Unilevel)?.Result.UplineId.AssociateId ?? 0;
                }

                Associate sponsorSummary = new Associate();
                Associate enrollerSummary = new Associate();
                if (enrollerID <= 0)
                {
                    enrollerSummary = new Associate();
                }
                else
                {
                    enrollerSummary = await _distributorService.GetAssociate(enrollerID);
                }
                if (sponsorID > 0)
                {
                    sponsorSummary = await _distributorService.GetAssociate(sponsorID);
                }
                else
                {
                    sponsorSummary = enrollerSummary;
                }
                var ZiplingoEngagementRequest = new AssociateContactModel
                {
                    AssociateId = AssociateInfo.Result.AssociateId,
                    AssociateType = AssociateInfo.Result.AssociateBaseType,
                    BackOfficeId = AssociateInfo.Result.BackOfficeId,
                    birthday = AssociateInfo.Result.BirthDate,
                    address = AssociateInfo.Result.Address.AddressLine1 + " " + AssociateInfo.Result.Address.AddressLine2 + " " + AssociateInfo.Result.Address.AddressLine3,
                    city = AssociateInfo.Result.Address.City,
                    CommissionActive = true,
                    CountryCode = AssociateInfo.Result.Address.CountryCode,
                    distributerId = AssociateInfo.Result.BackOfficeId,
                    emailAddress = AssociateInfo.Result.EmailAddress,
                    firstName = AssociateInfo.Result.DisplayFirstName,
                    lastName = AssociateInfo.Result.DisplayLastName,
                    phoneNumber = AssociateInfo.Result.TextNumber,
                    region = AssociateInfo.Result.Address.CountryCode,
                    state = AssociateInfo.Result.Address.State,
                    zip = AssociateInfo.Result.Address.PostalCode,
                    LanguageCode = AssociateInfo.Result.LanguageCode,
                    UserName = UserName,
                    WebAlias = UserName,
                    CompanyUrl = company.Result.BackOfficeHomePageURL,
                    CompanyDomain = company.Result.BackOfficeHomePageURL,
                    CompanyName = settings.CompanyName,
                    EnrollerId = enrollerSummary.AssociateId,
                    SponsorId = sponsorSummary.AssociateId,
                    EnrollerName = enrollerSummary.DisplayFirstName + ' ' + enrollerSummary.DisplayLastName,
                    EnrollerMobile = enrollerSummary.PrimaryPhone,
                    EnrollerEmail = enrollerSummary.EmailAddress,
                    SponsorName = sponsorSummary.DisplayFirstName + ' ' + sponsorSummary.DisplayLastName,
                    SponsorMobile = sponsorSummary.PrimaryPhone,
                    SponsorEmail = sponsorSummary.EmailAddress
                };

                var jsonReq = JsonConvert.SerializeObject(ZiplingoEngagementRequest);
                CallZiplingoEngagementApi(jsonReq, "Contact/CreateContactV2");
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in UpdateContact", e.Message);
            }
        }

        public void AssociateStatusChangeTrigger(int associateId, int oldStatusId, int newStatusId)
        {
            try
            {
                AssociateStatusChange obj = new AssociateStatusChange();
                var distributorInfo = _distributorService.GetAssociate(associateId);
                obj.OldStatusId = oldStatusId;
                obj.OldStatus = _ZiplingoEngagementRepository.GetStatusById(oldStatusId);
                obj.NewStatusId = newStatusId;
                obj.NewStatus = _ZiplingoEngagementRepository.GetStatusById(newStatusId);
                obj.AssociateId = associateId;
                obj.FirstName = distributorInfo.Result.DisplayFirstName;
                obj.LastName = distributorInfo.Result.DisplayLastName;
                obj.EmailAddress = distributorInfo.Result.EmailAddress;
                CallOrderZiplingoEngagementTriggerForAssociateChangeStatus(obj, "ChangeAssociateStatus");
            }
            catch (Exception ex)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in ChangeAssociateStatus", ex.Message);
            }
        }

        public async void SendOrderShippedEmail(int packageId, string trackingNumber)
        {
            var orderModel = new OrderDetailModel();
            var shipInfo = _ZiplingoEngagementRepository.GetOrderNumber(packageId);
            orderModel.TrackingNumber = trackingNumber;
            orderModel.Carrier = shipInfo.Carrier;
            orderModel.ShipMethodId = shipInfo.ShipMethodId;
            orderModel.DateShipped = shipInfo.DateShipped;
            orderModel.Order = await _orderService.GetOrderByOrderNumber(shipInfo.OrderNumber);
            if (orderModel.Order.OrderType == OrderType.Autoship)
            {
                var autoShipInfo = _ZiplingoEngagementRepository.GetAutoshipFromOrder(shipInfo.OrderNumber);
                orderModel.AutoshipId = autoShipInfo.AutoshipId;
                CallOrderZiplingoEngagementTriggerForShipped(orderModel, "AutoOrderShipped");
            }
            if (orderModel.Order.OrderType == OrderType.Standard)
            {
                CallOrderZiplingoEngagementTriggerForShipped(orderModel, "OrderShipped");
            }
        }

        public void AssociateBirthDateTrigger()
        {
            string eventKey = "AssociateBirthdayWishes";
            var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
            if (eventSetting != null && eventSetting?.Status == true)
            {
                var associateInfo = _ZiplingoEngagementRepository.AssociateBirthdayWishesInfo();
                if (associateInfo == null) return;

                for (int i = 0; i < associateInfo.Count; i = i + 100)
                {
                    List<AssociateInfoList> assoList = new List<AssociateInfoList>();
                    var items = associateInfo.Skip(i).Take(100);
                    foreach (var assoInfo in items)
                    {
                        AssociateInfoList objasso = new AssociateInfoList();
                        objasso.AssociateId = assoInfo.AssociateId;
                        objasso.Birthdate = assoInfo.Birthdate;
                        objasso.EmailAddress = assoInfo.EmailAddress;
                        objasso.FirstName = assoInfo.FirstName;
                        objasso.LastName = assoInfo.LastName;
                        assoList.Add(objasso);
                    }
                    CallOrderZiplingoEngagementTriggerListForBirthDayWishes(assoList, "AssociateBirthdayWishes");
                }
            }
        }

        public void AssociateWorkAnniversaryTrigger()
        {
            string eventKey = "AssociateWorkAnniversary";
            var eventSetting = _ZiplingoEngagementRepository.GetEventSettingDetail(eventKey);
            if (eventSetting != null && eventSetting?.Status == true)
            {
                var associateInfo = _ZiplingoEngagementRepository.AssociateWorkAnniversaryInfo();
                if (associateInfo == null) return;

                for (int i = 0; i < associateInfo.Count; i = i + 100)
                {
                    List<AssociateWorkAnniversaryInfoList> assoList = new List<AssociateWorkAnniversaryInfoList>();
                    var items = associateInfo.Skip(i).Take(100);
                    foreach (var assoInfo in items)
                    {
                        AssociateWorkAnniversaryInfoList objasso = new AssociateWorkAnniversaryInfoList();
                        objasso.AssociateId = assoInfo.AssociateId;
                        objasso.Birthdate = assoInfo.Birthdate;
                        objasso.EmailAddress = assoInfo.EmailAddress;
                        objasso.FirstName = assoInfo.FirstName;
                        objasso.LastName = assoInfo.LastName;
                        objasso.SignupDate = assoInfo.SignupDate;
                        objasso.TotalWorkingYears = assoInfo.TotalWorkingYears;
                        assoList.Add(objasso);
                    }
                    CallOrderZiplingoEngagementTriggerListForWorkAnniversary(assoList, eventKey);
                }
            }
        }

        public EmailOnNotificationEvent OnNotificationEvent(NotificationEvent notification)
        {
            switch (notification.EventType)
            {
                case EventType.RankAdvancement:
                    return CallRankAdvancementEvent(notification);
            }
            return null;
        }
        public LogRealtimeRankAdvanceHookResponse LogRealtimeRankAdvanceEvent(LogRealtimeRankAdvanceHookRequest req)
        {
            return LogRankAdvancement(req);
        }

        public LogRealtimeRankAdvanceHookResponse LogRankAdvancement(LogRealtimeRankAdvanceHookRequest req)
        {
            try
            {
                AssociateRankAdvancement obj = new AssociateRankAdvancement();
                var rankName = _rankService.GetRankName(req.NewRank);
                obj.Rank = req.NewRank;
                obj.RankName = rankName.ToString();
                obj.AssociateId = req.AssociateId;
                obj.FirstName = "Log";
                obj.LastName = "Log";
                CallOrderZiplingoEngagementTriggerForAssociateRankAdvancement(obj, "RankAdvancement");
                return null;
            }
            catch (Exception ex)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in RankAdvancement", ex.Message);
            }
            return null;
        }

        public IRestResponse CallZiplingoEngagementApi(string jsonData, string apiMethod)
        {
            var settings = _ZiplingoEngagementRepository.GetSettings();
            var apiUrl = settings.ApiUrl + apiMethod;
            var client = new RestClient(apiUrl);
            var messageRequest = new RestRequest(Method.POST);

            client.Authenticator = new HttpBasicAuthenticator(settings.Username, settings.Password);

            messageRequest.AddHeader("cache-control", "no-cache");
            messageRequest.AddHeader("content-type", "application/json");

            messageRequest.AddParameter("application/json", jsonData, ParameterType.RequestBody);
            client.Timeout = 3600000;

            ServicePointManager.ServerCertificateValidationCallback = new
                RemoteCertificateValidationCallback
                (
                    delegate { return true; }
                );

            return client.Execute(messageRequest);
        }

        public EmailOnNotificationEvent CallRankAdvancementEvent(NotificationEvent notification)
        {
            string str = JsonConvert.SerializeObject(notification.EventValue);
            AssociateRankAdvancement obj = JsonConvert.DeserializeObject<AssociateRankAdvancement>(str);
            var rank = obj.Rank;
            var rankName = _rankService.GetRankName(rank);
            var distributorinfo = _distributorService.GetAssociate(notification.AssociateId);
            obj.RankName = rankName.ToString();
            obj.AssociateId = distributorinfo.Result.AssociateId;
            obj.FirstName = distributorinfo.Result.DisplayFirstName;
            obj.LastName = distributorinfo.Result.DisplayLastName;
            CallOrderZiplingoEngagementTriggerForAssociateRankAdvancement(obj, "RankAdvancement");
            return null;
        }

        public void ResetSettings(CommandRequest commandRequest)
        {
            try
            {
                _ZiplingoEngagementRepository.ResetSettings();
            }
            catch (Exception ex)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in ResetSettings", ex.Message);
            }
        }

        public void UpdateAssociateType(int associateId, string oldAssociateType, string newAssociateType)
        {
            try
            {
                var company = _companyService.GetCompany();
                var associateTypeModel = new AssociateTypeModel();
                var settings = _ZiplingoEngagementRepository.GetSettings();
                var associateSummary = _distributorService.GetAssociate(associateId);
                associateTypeModel.AssociateId = associateId;
                associateTypeModel.FirstName = associateSummary.Result.DisplayFirstName;
                associateTypeModel.LastName = associateSummary.Result.DisplayLastName;
                associateTypeModel.Email = associateSummary.Result.EmailAddress;
                associateTypeModel.Phone = (associateSummary.Result.TextNumber == "" || associateSummary.Result.TextNumber == null)
                    ? associateSummary.Result.PrimaryPhone
                    : associateSummary.Result.TextNumber;
                associateTypeModel.OldAssociateBaseType = oldAssociateType;
                associateTypeModel.NewAssociateBaseType = newAssociateType;
                associateTypeModel.CompanyDomain = company.Result.BackOfficeHomePageURL;
                associateTypeModel.LogoUrl = settings.LogoUrl;
                associateTypeModel.CompanyName = settings.CompanyName;

                var strData = JsonConvert.SerializeObject(associateTypeModel);

                ZiplingoEngagementRequest request = new ZiplingoEngagementRequest
                {
                    associateid = associateId,
                    companyname = settings.CompanyName,
                    eventKey = "AssociateTypeChange",
                    data = strData
                };
                var jsonReq = JsonConvert.SerializeObject(request);
                CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");

            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in AssociateTypeChange", e.Message);
            }
        }

        public void FiveDayRunTrigger(List<AutoshipInfo> autoships)
        {
            try
            {
                var company = _companyService.GetCompany();
                var settings = _ZiplingoEngagementRepository.GetSettings();
                foreach (AutoshipInfo autoship in autoships)
                {
                    try
                    {
                        FivedayAutoshipModel autoObj = new FivedayAutoshipModel();
                        autoObj.AssociateId = autoship.AssociateId;
                        autoObj.AutoshipId = autoship.AutoshipId;
                        autoObj.UplineID = autoship.UplineID;
                        autoObj.BackOfficeID = autoship.BackOfficeID;
                        autoObj.FirstName = autoship.FirstName;
                        autoObj.LastName = autoship.LastName;
                        autoObj.PrimaryPhone = autoship.PrimaryPhone;
                        autoObj.StartDate = autoship.StartDate;
                        autoObj.NextProcessDate = autoship.NextProcessDate;
                        autoObj.SponsorName = autoship.SponsorName;
                        autoObj.SponsorEmail = autoship.SponsorEmail;
                        autoObj.SponsorMobile = autoship.SponsorMobile;
                        autoObj.OrderNumber = autoship.OrderNumber;
                        autoObj.CompanyDomain = company.Result.BackOfficeHomePageURL;
                        autoObj.LogoUrl = settings.LogoUrl;
                        autoObj.CompanyName = settings.CompanyName;
                        if (autoObj.OrderNumber > 0)
                        {

                        }
                        var strData = JsonConvert.SerializeObject(autoObj);
                        ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = autoship.AssociateId, companyname = settings.CompanyName, eventKey = "FiveDayAutoship", data = strData };
                        var jsonReq = JsonConvert.SerializeObject(request);
                        CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                    }
                    catch (Exception ex)
                    {
                        _customLogRepository.CustomErrorLog(0, 0, "Error with in FiveDayAutoship", ex.Message);
                    }
                }

            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in FiveDayAutoship", e.Message);
            }
        }

        public void ExpirationCardTrigger(List<CardInfo> cardinfo)
        {
            try
            {
                var company = _companyService.GetCompany();
                var settings = _ZiplingoEngagementRepository.GetSettings();

                foreach (CardInfo info in cardinfo)
                {
                    try
                    {
                        AssociateCardInfoModel assoObj = new AssociateCardInfoModel();
                        assoObj.FirstName = info.FirstName;
                        assoObj.LastName = info.LastName;
                        assoObj.PrimaryPhone = info.PrimaryPhone;
                        assoObj.Email = info.PrimaryPhone;
                        assoObj.CardDate = info.ExpirationDate;
                        assoObj.CardLast4Degit = info.Last4DegitOfCard;
                        assoObj.CompanyDomain = company.Result.BackOfficeHomePageURL;
                        assoObj.LogoUrl = settings.LogoUrl;
                        assoObj.CompanyName = settings.CompanyName;

                        var strData = JsonConvert.SerializeObject(assoObj);
                        ZiplingoEngagementRequest request = new ZiplingoEngagementRequest { associateid = info.AssociateId, companyname = settings.CompanyName, eventKey = "UpcommingExpiryCard", data = strData };
                        var jsonReq = JsonConvert.SerializeObject(request);
                        CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                    }
                    catch (Exception ex)
                    {
                        _customLogRepository.CustomErrorLog(0, 0, "Error with in UpcommingExpiryCard", ex.Message);
                    }
                }

            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in UpcommingExpiryCard", e.Message);
            }
        }

        public async void ExecuteCommissionEarned()
        {
            try
            {
                var settings = _ZiplingoEngagementRepository.GetSettings();

                var payments = await _paymentProcessingService.FindPaidPayments(DateTime.Now.Date.AddDays(-1), DateTime.Now.Date, "");

                foreach (var payment in payments)
                {
                    var jsonZiplingoEngagementRequest = JsonConvert.SerializeObject(payment);

                    ZiplingoEngagementRequest request = new ZiplingoEngagementRequest();

                    request = new ZiplingoEngagementRequest { associateid = payment.AssociateId, companyname = settings.CompanyName, eventKey = "CommissionEarned", data = jsonZiplingoEngagementRequest };

                    var jsonReq = JsonConvert.SerializeObject(request);

                    CallZiplingoEngagementApi(jsonReq, "Campaign/ExecuteTrigger");
                }
            }
            catch (Exception e)
            {
                _customLogRepository.CustomErrorLog(0, 0, "Error with in ExecuteCommissionEarned", e.Message);
            }
        }
    }
}
