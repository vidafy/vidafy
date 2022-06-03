using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Models.OrderInvoice
{
    public class ShippingInformation
    {
        public InvoiceAddress ShippingAddress { get; set; }
        public string ShippingMethodDescription { get; set; }
        public double ShippingWeight { get; set; }
    }
}
