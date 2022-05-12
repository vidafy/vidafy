using DirectScale.Disco.Extension;

namespace WebExtension.Models
{
    public class BomQuery
    {
        public Bom[] BillOfMaterialItems { get; set; }
    }

    public class BomQueryResponse
    {
        public BomQuery Data { get; set; }
    }
}
