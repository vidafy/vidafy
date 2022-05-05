using WebExtension.Repositories;
using System;

namespace WebExtension.Services
{
    public interface ICustomLogService
    {
        void SaveLog(int associateId, int orderId, string title, string message, string error, string url, string other, string request, string response);
    }
    public class CustomLogService : ICustomLogService
    {
        private readonly ICustomLogRepository _customLogRepository;
        public CustomLogService(ICustomLogRepository customLogRepository)
        {
            _customLogRepository = customLogRepository ?? throw new ArgumentNullException(nameof(customLogRepository));
        }
        public void SaveLog(int associateId, int orderId, string title, string message, string error, string url, string other, string request, string response)
        {
            try 
            {
                _customLogRepository.SaveLog(associateId, orderId, title, message, error, url, other, request, response);
            }
            catch(Exception e)
            {
                
            }
        }
    }
}
