using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebExtension.Views.Model
{
    public class DateInput
    {
        private string _handle;

        public DateInput()
        {
            this.Id = nameof(DateInput);
            this.Opens = "right";
            this.LinkedCalendars = "true";
            this.AutoApply = "false";
            this.Type = "range";
            this.IsTimePicker = "false";
            this.Name = nameof(BegDate);
            this.EndName = nameof(EndDate);
            this.Format = "MM/DD/YYYY";
        }

        public string Type { get; set; }

        public string Id { get; set; }

        public DateTime BegDate { get; set; }

        public DateTime EndDate { get; set; }

        public string IsTimePicker { get; set; }

        public string Class { get; set; }

        public string Style { get; set; }

        public string Name { get; set; }

        public string EndName { get; set; }

        public string OnChange { get; set; }

        public string Opens { get; set; }

        public string Drops { get; set; }

        public string Format { get; set; }

        public string LinkedCalendars { get; set; }

        public string AutoApply { get; set; }

        public string Handle
        {
            get
            {
                if (string.IsNullOrEmpty(this._handle))
                    return this.Id;
                return this._handle;
            }
            set
            {
                this._handle = value;
            }
        }
    }
}
