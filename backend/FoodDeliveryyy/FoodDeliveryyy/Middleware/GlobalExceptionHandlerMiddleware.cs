using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;


namespace FoodDeliveryyy.Middleware
{

    public class GlobalExceptionHandlerMiddleware : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;
        private readonly IWebHostEnvironment _env;


        public GlobalExceptionHandler (ILogger<GlobalExceptionHandler> logger,IWebHostEnvironment env)
        {
            _logger = logger;
            _env = env;

        }

        public async ValueTask<bool>
    }





}
