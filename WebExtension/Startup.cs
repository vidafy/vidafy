using DirectScale.Disco.Extension.Middleware;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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

            services.AddCors();

            // services.AddResponseCaching();
            services.AddControllers();
            services.AddTransient<OrderWebService>();
            services.AddTransient<OrderInvoiceService>();


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
            if (CurrentEnvironment.IsDevelopment())
            {
                //services.AddSingleton<ITokenProvider>(x => new WebExtensionTokenProvider
                //{
                //    DirectScaleUrl = Configuration["configSetting:BaseURL"].Replace("{clientId}", Configuration["configSetting:Client"]).Replace("{environment}", Configuration["configSetting:Environment"]),
                //    DirectScaleSecret = Configuration["configSetting:DirectScaleSecret"],
                //    ExtensionSecrets = new[] { Configuration["configSetting:ExtensionSecrets"] }
                //});
            }
            //Remark This section before upload


           
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
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            string environmentURL = Environment.GetEnvironmentVariable("DirectScaleServiceUrl");

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
            //app.UseCors(builder => builder
            //    .AllowAnyOrigin()
            //    .AllowAnyHeader()
            //    .AllowAnyMethod());


            app.UseCors(builder =>
            {
                builder
                    .WithOrigins("https://vidafy.corpadmin.directscalestage.com", "https://vidafy.clientextension.directscalestage.com")
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
            });

            app.UseHttpsRedirection();

            app.UseStaticFiles(new StaticFileOptions
            {
                OnPrepareResponse = ctx =>
                {
                    ctx.Context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                }
            });

            app.UseStaticFiles();

            app.UseRouting();

            app.UseAuthorization();

            //DS
            app.UseDirectScale();

            app.Use(async (context, next) =>
             {
                 //context.Response.Headers.Add("X-Frame-Options", "ALLOW-FROM " + environmentURL); // https://vidafy.corpadmin.directscalestage.com
                 context.Response.Headers.Add("Content-Security-Policy", "frame-ancestors 'self' https://vidafy.corpadmin.directscalestage.com/ https://vidafy.clientextension.directscalestage.com;");
                 
                 await next();
             });

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
