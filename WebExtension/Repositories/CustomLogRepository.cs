using Dapper;
using DirectScale.Disco.Extension.Services;
using System;
using System.Data.SqlClient;

namespace WebExtension.Repositories
{
    public interface ICustomLogRepository
    {
        void SaveLog(int associateId, int orderId, string title, string message, string error, string url, string other, string request, string response);
        void CustomErrorLog(int associateId, int orderId,string message, string error);
    }
    public class CustomLogRepository : ICustomLogRepository
    {
        private readonly IDataService _dataService;

        public CustomLogRepository(IDataService dataService)
        {
            _dataService = dataService ?? throw new ArgumentNullException(nameof(dataService));
        }

        public void SaveLog(int associateId, int orderId, string title, string message, string error, string url, string other, string request, string response)
        {
            using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
            {
                var parameters = new
                {
                    associateId,
                    orderId,
                    title,
                    message,
                    error,
                    url,
                    other,
                    request,
                    response
                };
                var insertStatement = @"INSERT INTO [Client].[CustomLog](AssociateID,OrderID,Title,Message,Error,last_modified,Url,Request,Response,Other) VALUES(@associateId,@orderId,@title,@message,@error,GETDATE(),@url,@request,@response,@other)";
                dbConnection.Execute(insertStatement, parameters);
            }
        }
        public void CustomErrorLog(int associateId, int orderId,string message, string error)
        {
            using (var dbConnection = new SqlConnection(_dataService.GetClientConnectionString().Result))
            {
                var parameters = new
                {
                    associateId,
                    orderId,
                    message,
                    error
                };
                var insertStatement = @"INSERT INTO [Client].[CheckErrorLogResponse](AssociateID,OrderID,Message,Error,last_modified) VALUES(@associateId,@orderId,@message,@error,GETDATE())";
                dbConnection.Execute(insertStatement, parameters);
            }
        }
    }
}

/*CREATE TABLE [Client].[CustomLog](
	[recordnumber] [int] IDENTITY(1,1) primary key NOT NULL,
	[last_modified] [datetime] NOT NULL,
	[AssociateID] [int] NULL,
	[OrderID] [int] NULL,
	[Title] [varchar](max) NULL,
	[Message] [varchar](max) NULL,
	[Error] [varchar](max) NULL,
	[Url] [varchar](max) NULL,
	[Request] [varchar](max) NULL,
	[Response] [varchar](max) NULL,
	[Other] [varchar](max) NULL
)*/