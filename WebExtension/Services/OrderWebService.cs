﻿using DirectScale.Disco.Extension;
using DirectScale.Disco.Extension.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using WebExtension.Models;
using WebExtension.Repositories;
using WebExtension.Views.Model;

namespace WebExtension.Services
{
    public interface IOrderWebService
    {
        Task<List<OrderViewModel>> GetFilteredOrders(string search, DateTime beginDate, DateTime endDate);
        Task<List<Bom>> BillOfMaterialItemsDetails(int itemId);
        List<ActiveCountry> GetWareHouseDetails();

       Order[] GetShippableOrders(DateTime begin, DateTime end, object code, object name, object category);

    }
    public class OrderWebService : IOrderWebService
    {
        private readonly IOrderWebRepository _orderWebRepository;
        private readonly IOrderService _orderService;
        private readonly ICurrencyService _currencyService;
        public OrderWebService(IOrderWebRepository orderWebRepository,
            IOrderService orderService, ICurrencyService currencyService)
        {
            _orderWebRepository = orderWebRepository ?? throw new ArgumentNullException(nameof(orderWebRepository));
            _orderService = orderService ?? throw new ArgumentNullException(nameof(orderService));
            _currencyService = currencyService ?? throw new ArgumentNullException(nameof(currencyService));
        }

        public  List<ActiveCountry> GetWareHouseDetails()
        {
            return _orderWebRepository.GetWarehouseItemDetails();
        }

        public Order[] GetShippableOrders(DateTime begin, DateTime end, object code, object name, object category)
        {
            return _orderWebRepository.GetShippableOrders(begin, end, code, name, category);
        }

        public async Task<List<OrderViewModel>> GetFilteredOrders(string search, DateTime beginDate, DateTime endDate)
        {
            try
            {
                var orderIds = _orderWebRepository.GetFilteredOrderIds(search, beginDate, endDate);
                if (orderIds.Count > 0)
                {
                    var orders = await _orderService.GetOrders(orderIds.ToArray());

                    return orders.Select(o =>
                    {
                        return new OrderViewModel(o)
                        {
                            USDTotalFormatted = o.USDTotal.ToString(),
                            USDSubTotalFormatted = o.USDSubTotal.ToString()
                        };
                    }).ToList();
                }
            }
            catch (Exception e)
            {

            }
            return new List<OrderViewModel>();
        }

        public async Task<List<Bom>> BillOfMaterialItemsDetails(int itemId)
        {
            return _orderWebRepository.billOfMaterialItems(itemId);
        }
    }
}
