using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
using System.Reflection.Metadata.Ecma335;
using FoodDeliveryyy.Models;

namespace FoodDeliveryyy.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class AIController : ControllerBase

{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIController> _logger;


    public AIController(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<AIController> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }


    [HttpPost("chat")]
    public async Task<IActionResult> ChatWithAI([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Prompt))
        {
            return BadRequest("Prompt cannot be empty.");
        }

        var apiKey = _configuration["OpenAI:ApiKey"];
        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogError("OpenAI API Key is not configured.");
            return StatusCode(500, new { message = "AI service is not configured." });
        }

        var client = _httpClientFactory.CreateClient();

        var requestBody = new
        {
            model = "gpt-3.5-turbo",
            messages = new[]
         {
                new { role = "system", content = "You are a helpful assistant for a food delivery app called BlinkBite. Answer questions about the app, menu items, orders, etc. Keep answers concise and friendly." },
                new { role = "user", content = request.Prompt }
            },
            max_tokens = 300,
            temperature = 0.7
        };

        var jsonRequest = JsonSerializer.Serialize(requestBody);
        var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

        try
        {
            var response = await client.PostAsync("https://api.openai.com/v1/chat/completions", httpContent);
            var jsonResponse = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"OpenAI API Error: {jsonResponse}");
                return StatusCode((int)response.StatusCode, new { message = "AI service returned an error." });
            }

            using var doc = JsonDocument.Parse(jsonResponse);
            var aiReply = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();


            return Ok(new { reply = aiReply });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with OpenAI API.");
            return StatusCode(500, new { message = "An error occurred while communicating with the AI service." });
        }

    }
}