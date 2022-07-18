using DirectScale.Disco.Extension;
using System.Collections.Generic;

namespace WebExtension.Models
{
    public class BomQuery
    {
        public List<BillOfMaterialItem> BillOfMaterialItems { get; set; }
        public BomQuery()
        {
            BillOfMaterialItems = new List<BillOfMaterialItem>();
        }
    }
    public class BillOfMaterialItem
    {
        public int ItemId { get; set; }
        public double Qty { get; set; }
        public string SKU { get; set; }
        public string EnglishDescription { get; set; }
    }
}
