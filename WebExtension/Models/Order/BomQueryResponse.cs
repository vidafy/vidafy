using DirectScale.Disco.Extension;
using System.Collections.Generic;

namespace WebExtension.Models
{
    public class BomQuery
    {
        public List<Bom> BillOfMaterialItems { get; set; }
        public BomQuery()
        {
            BillOfMaterialItems = new List<Bom>();
        }
    }
}
