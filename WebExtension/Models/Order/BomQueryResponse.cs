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
        public BomQueryResponse()
        {
            Status = 0;
            Message = "Success";
            Data = new BomQuery();
        }
        public int Status { get; set; }

        public string Message { get; set; }
    }
}
