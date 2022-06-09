﻿using WebExtension.Helper.Models;
using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Views.Model;

namespace WebExtension.Services
{
    public interface IExtensionOrderService
    {
        Invoice GetInvoiceData(int orderNumber);
    }
    public class OrderInvoiceService: IExtensionOrderService
    {
        private readonly IOrderService _orderService;
        private readonly IAssociateService _associateService;
        private readonly IShippingService _shippingService;
        private readonly IBomService _bomService;

        public OrderInvoiceService(IOrderService orderService, IAssociateService associateService, IShippingService shippingService, IBomService bomService)
        {
            _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
            _associateService = associateService ?? throw new ArgumentNullException(nameof(associateService));
            _shippingService = shippingService ?? throw new ArgumentNullException(nameof(shippingService));
            _bomService = bomService ?? throw new ArgumentNullException(nameof(bomService));
        }

        public  Invoice GetInvoiceData(int orderNumber)
        {
            Task<Order> orderInfo = _orderService.GetOrderByOrderNumber(orderNumber);
            Task<Associate> distributorSummary = _associateService.GetAssociate(orderInfo.Result.AssociateId);
            var shippingInformation = GetShippingInformation(distributorSummary.Result, orderInfo.Result.Packages);

            var invoiceAmount = new InvoiceAmounts();
            foreach (var total in orderInfo.Result.Totals)
            {
                invoiceAmount.Subtotal = $"{total.SubTotal:C2}";
                invoiceAmount.Tax = $"{total.Tax:C2}";
                invoiceAmount.Shipping = $"{total.Shipping:C2}";
                invoiceAmount.Total = $"{total.Total:C2}";
                invoiceAmount.Handling = $"{0.00:C2}";
                invoiceAmount.BalanceDue = $"{total.TotalDue:C2}";
            }

            var invoicePayments = new List<InvoicePaymentDetails>();
            foreach (var payment in orderInfo.Result.Payments)
            {
                invoicePayments.Add(new InvoicePaymentDetails
                {
                    Amount = $"{payment.Amount:C2}",
                    PaymentDate = payment.PayDate,
                    Type = payment.PayType
                });
            }

            var invoiceItems = new List<InvoiceItem>();
            foreach (var lineItem in orderInfo.Result.LineItems)
            {
                Task <Bom[]> boms = _bomService.GetBOM(lineItem.ItemId);
                var invoiceBoms = boms.Result.Select(bom => new InvoiceBOM
                {
                    Description = bom.EnglishDescription,
                    Name = bom.Sku,
                    Qty = bom.Qty
                })
                .ToList();

                invoiceItems.Add(new InvoiceItem
                {
                    BOMs = invoiceBoms,
                    ItemNumber = lineItem.SKU,
                    Qty = lineItem.Qty,
                    Price = $"{lineItem.Amount:C2}",
                    Total = $"{(lineItem.Amount * lineItem.Qty):C2}",
                    Description = lineItem.ProductName
                });
            }

            var invoiceStatus = "Pending";
            if (orderInfo.Result.IsShipped)
            {
                invoiceStatus = "Shipped";
            }
            else if (orderInfo.Result.IsPaid)
            {
                invoiceStatus = "Paid";
            }

            var invoice = new Invoice
            {
                AdditionalInformation = orderInfo.Result.SpecialInstructions,
                BackOfficeId = distributorSummary.Result.BackOfficeId,
                BillToAddress = new InvoiceAddress
                {
                    Address = orderInfo.Result.BillAddress.AddressLine1,
                    Address2 = orderInfo.Result.BillAddress.AddressLine2,
                    City = orderInfo.Result.BillAddress.City,
                    CompanyName = distributorSummary.Result.CompanyName,
                    FullName = distributorSummary.Result.Name,
                    State = orderInfo.Result.BillAddress.State,
                    Zip = orderInfo.Result.BillAddress.PostalCode
                },
                Date = DateTime.Today,
                Email = distributorSummary.Result.EmailAddress,
                FirstLastName = distributorSummary.Result.Name,
                InvoiceAmount = invoiceAmount,
                Items = invoiceItems,
                OrderNumber = orderInfo.Result.OrderNumber,
                PaymentDetails = invoicePayments,
                PhoneNumber = orderInfo.Result.BillPhone,
                ShippingMethod = shippingInformation.ShippingMethodDescription,
                ShipToAddress = shippingInformation.ShippingAddress,
                Status = invoiceStatus,
                Weight = shippingInformation.ShippingWeight
            };

            return invoice;
        }

        private ShippingInformation GetShippingInformation(Associate distributorSummary, List<OrderPackage> orderPackages)
        {
            var defaultAddress = distributorSummary.ShipAddress;
            var invoiceAddress = new InvoiceAddress
            {
                Address = defaultAddress.AddressLine1,
                Address2 = defaultAddress.AddressLine2,
                City = defaultAddress.City,
                CompanyName = distributorSummary.CompanyName,
                FullName = distributorSummary.Name,
                State = defaultAddress.State,
                Zip = defaultAddress.PostalCode
            };
            var shippingMethod = string.Empty;
            var packageWeight = 0d;

            if (orderPackages.Any())
            {
                var firstOrderPackage = orderPackages.First();

                // Set ShipToAddress
                invoiceAddress.Address = firstOrderPackage.ShippingAddress.AddressLine1;
                invoiceAddress.Address2 = firstOrderPackage.ShippingAddress.AddressLine2;
                invoiceAddress.City = firstOrderPackage.ShippingAddress.City;
                invoiceAddress.CompanyName = distributorSummary.CompanyName;
                //nvoiceAddress.FullName = distributorSummary.Name;
                invoiceAddress.FullName = firstOrderPackage.ShipTo;
                invoiceAddress.State = firstOrderPackage.ShippingAddress.State;
                invoiceAddress.Zip = firstOrderPackage.ShippingAddress.PostalCode;

                // Set ShipMethodDescription
                shippingMethod = (_shippingService.GetShippingMethod(firstOrderPackage.ShipMethodId))?.Result.DisplayText ?? "Not Specified";

                // Set Total Weight
                packageWeight += orderPackages.Sum(orderPackage => orderPackage.Weight);
            }

            return new ShippingInformation
            {
                ShippingAddress = invoiceAddress,
                ShippingMethodDescription = shippingMethod,
                ShippingWeight = packageWeight
            };
        }
    }
}
