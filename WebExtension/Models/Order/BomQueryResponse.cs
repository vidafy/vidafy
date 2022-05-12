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

    public class BomQueryResponse
    {
        public BomQueryResponse()
        {
            Status = 0;
            Message = "Success";
            Data = new BomQuery();
        }
        public BomQuery Data { get; set; }
        public int Status { get; set; }

        public string Message { get; set; }
    }
}
