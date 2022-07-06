using DirectScale.Disco.Extension.Middleware;
using DirectScale.Disco.Extension.Middleware.Models;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Newtonsoft.Json.Serialization;
using System.Collections.Generic;
using System.Threading.Tasks;
using WebExtension.Helper;
using WebExtension.Helper.Interface;
using WebExtension.Helper.Models;
using WebExtension.Hooks;
using WebExtension.Hooks.Associate;
using WebExtension.Hooks.Order;
using WebExtension.Repositories;
using WebExtension.Services;
using WebExtension.Services.DailyRun;
using WebExtension.Services.ZiplingoEngagementService;
using System;
using System.Globalization;
using Microsoft.AspNetCore.Localization;

namespace WebExtension
{
    public class Startup
    {
        public Startup(IConfiguration configuration, IWebHostEnvironment env)
        {
            Configuration = configuration;
            CurrentEnvironment = env;
        }

        public IConfiguration Configuration { get; }
        private IWebHostEnvironment CurrentEnvironment { get; set; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            // Add cors

            string environmentURL = Environment.GetEnvironmentVariable("DirectScaleServiceUrl");

            // services.AddResponseCaching();
            services.AddControllers();
            services.AddTransient<OrderWebService>();
            services.AddTransient<OrderInvoiceService>();
            services.AddCors(options =>
            {
                options.AddPolicy("CorsPolicy",
                    builder => builder.WithOrigins(environmentURL, environmentURL.Replace("corpadmin", "clientextension"))
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowAnyOrigin());
            });

            services.AddRazorPages(options =>
            {
                options.Conventions.AuthorizeFolder("/OrderInvoice").AllowAnonymousToPage("/OrderInvoice/Invoice");
                options.Conventions.AllowAnonymousToPage("/OrderInvoice/InvoiceAll");
            });

            services.Configure<RequestLocalizationOptions>(options =>
            {
                var supportedUICultures = new[]
                {
                    new CultureInfo("en-US"),
                    new CultureInfo("es-US"),
                    new CultureInfo("en-GB"),
                    new CultureInfo("fr-FR"),
                };

                var supportedCultures = new[]
                {
                    new CultureInfo("en-US"),
                    new CultureInfo("en-GB"),
                    new CultureInfo("es-US")

                };

                options.DefaultRequestCulture = new RequestCulture(culture: "en-US", uiCulture: "en-US");
                options.SupportedCultures = supportedCultures;
                options.SupportedUICultures = supportedUICultures;


            });

            services.AddMvc();
            #region FOR LOCAL DEBUGGING USE
            //Remark This section before upload
            //services.AddSingleton<ITokenProvider>(x => new WebExtensionTokenProvider
            //{
            //    //DirectScaleUrl = "http://localhost:44309/",
            //    DirectScaleUrl = Configuration["configSetting:BaseURL"].Replace("{clientId}", "vidafy").Replace("{environment}", "stage"),
            //    DirectScaleSecret = "VidafyLive",
            //    ExtensionSecrets = new[] { "798FD6G7SHA4E9V" }
            //});
            //Remark This section before upload
            #endregion


            //Remark This section before upload

            services.AddMvc(setupAction => { setupAction.EnableEndpointRouting = false; }).AddJsonOptions(jsonOptions =>
            {
                jsonOptions.JsonSerializerOptions.PropertyNamingPolicy = null;
            }).SetCompatibilityVersion(CompatibilityVersion.Version_3_0);

            //DS
            services.AddDirectScale(c =>
            {
                //CustomPage
                c.AddCustomPage(DirectScale.Disco.Extension.Middleware.Models.Menu.Inventory, "Print Slips", "/OrderInvoice/index");
                
                // Hooks
                c.AddHook<SubmitOrderHook>();
                c.AddHook<FinalizeAcceptedOrderHook>();
                c.AddHook<WriteApplication>();
                c.AddHook<UpdateAssociateHook>();
                c.AddHook<FinalizeNonAcceptedOrder>();
                c.AddHook<MarkPackageShippedHook>();
                c.AddHook<LogRealtimeRankAdvanceHook>();
                c.AddHook<DailyRun>();

                // Event Handlers
                c.AddEventHandler("3", "/api/webhooks/Associate/UpdateAssociate"); // Update Associate Event (3)
                services.AddControllers();
                //ZiplingoEngagementSetting page
                c.AddCustomPage(Menu.Settings, "Ziplingo Engagement Setting", "/CustomPage/ZiplingoEngagementSetting");
            });

            //Repositories
            services.AddSingleton<ICustomLogRepository, CustomLogRepository>();
            services.AddSingleton<IAssociateWebRepository, AssociateWebRepository>();
            services.AddSingleton<IOrderWebRepository, OrderWebRepository>();
            services.AddSingleton<IZiplingoEngagementRepository, ZiplingoEngagementRepository>();
            services.AddSingleton<IDailyRunRepository, DailyRunRepository>();


            //Services
            services.AddSingleton<ICommonService, CommonService>();
            services.AddSingleton<ICustomLogService, CustomLogService>();
            services.AddSingleton<IAssociateWebService, AssociateWebService>();
            services.AddSingleton<IOrderWebService, OrderWebService>();
            services.AddSingleton<IExtensionOrderService, OrderInvoiceService>();
            services.AddScoped<IHttpClientService, HttpClientService>();
            services.AddSingleton<IZiplingoEngagementService, ZiplingoEngagementService>();
            services.AddSingleton<IDailyRunService, DailyRunService>();



            services.AddControllersWithViews();

            //Swagger
            services.AddSwaggerGen();

            //Configurations
            services.Configure<configSetting>(Configuration.GetSection("configSetting"));
            services.AddMvc(option => option.EnableEndpointRouting = false);
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            var environmentUrl = Environment.GetEnvironmentVariable("DirectScaleServiceUrl");
            if (environmentUrl != null)
            {
                var serverUrl = environmentUrl.Replace("https://vidafy.corpadmin.", "");
                var appendUrl = @" http://"+ serverUrl + " " + "https://" + serverUrl + " " + "http://*." + serverUrl + " " + "https://*." + serverUrl;

                var csPolicy = "frame-ancestors https://code.jquery.com https://cdn.jsdelivr.net https://maxcdn.bootstrapcdn.com https://vidafy.corpadmin.directscale.com https://vidafy.corpadmin.directscalestage.com" + appendUrl + ";";
                app.UseRequestLocalization();

                if (env.IsDevelopment())
                {
                    app.UseDeveloperExceptionPage();
                }
                else
                {
                    app.UseExceptionHandler("/Home/Error");
                    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
                    app.UseHsts();
                }

                //Configure Cors
                app.UseRouting();

                app.UseCors("CorsPolicy");
                app.UseHttpsRedirection();

                app.UseStaticFiles(new StaticFileOptions
                {
                    OnPrepareResponse = ctx =>
                    {
                        ctx.Context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    }
                });

                app.UseStaticFiles();
                app.UseAuthorization();

                //DS
                app.UseDirectScale();
                app.Use(async (context, next) =>
                {
                    context.Response.Headers.Add("Content-Security-Policy", csPolicy);
                    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    await next();
                });
            }

            //Swagger
            app.UseSwagger();
            app.UseSwaggerUI(c => {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V2");
            });

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
            app.UseMvc();
        }
    }
    internal class WebExtensionTokenProvider : ITokenProvider
    {
        public string DirectScaleUrl { get; set; }
        public string DirectScaleSecret { get; set; }
        public string[] ExtensionSecrets { get; set; }

        public async Task<string> GetDirectScaleSecret()
        {
            return await Task.FromResult(DirectScaleSecret);
        }
        public async Task<string> GetDirectScaleServiceUrl()
        {
            return await Task.FromResult(DirectScaleUrl);
        }
        public async Task<IEnumerable<string>> GetExtensionSecrets()
        {
            return await Task.FromResult(ExtensionSecrets);
        }

    }
}
