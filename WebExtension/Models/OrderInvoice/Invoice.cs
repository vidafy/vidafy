using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Models.OrderInvoice
{
    public class Invoice
    {
        public string BackOfficeId { get; set; }
        public string FirstLastName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public int OrderNumber { get; set; }
        public DateTime Date { get; set; }
        public string ShippingMethod { get; set; }
        public double Weight { get; set; }
        public InvoiceAddress ShipToAddress { get; set; }
        public InvoiceAddress BillToAddress { get; set; }
        public List<InvoiceItem> Items { get; set; }
        public List<InvoicePaymentDetails> PaymentDetails { get; set; }
        public InvoiceAmounts InvoiceAmount { get; set; }
        public string AdditionalInformation { get; set; }
        public string Status { get; set; }
    }

    public class InvoiceAddress
    {
        public string CompanyName { get; set; }
        public string FullName { get; set; }
        public string Address { get; set; }
        public string Address2 { get; set; }
        public string City { get; set; }
        public string State { get; set; }
        public string Zip { get; set; }
    }
    public class InvoiceItem
    {
        public string ItemNumber { get; set; }
        public string Description { get; set; }

        public string Price { get; set; }
        public double Qty { get; set; }
        public string Total { get; set; }
        public List<InvoiceBOM> BOMs { get; set; }
    }
    public class InvoiceBOM
    {
        public string Name { get; set; }
        public double Qty { get; set; }
        public string Description { get; set; }
    }
    public class InvoicePaymentDetails
    {
        public DateTime PaymentDate { get; set; }
        public string Type { get; set; }
        public string Amount { get; set; }
    }
    public class InvoiceAmounts
    {
        public string Subtotal { get; set; }
        public string Tax { get; set; }
        public string Shipping { get; set; }
        public string Handling { get; set; }
        public string Total { get; set; }
        public string Payments { get; set; }
        public string BalanceDue { get; set; }
    }
}
