using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;
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
            return BadRequest(new { message = "Prompt cannot be empty." });
        }

        var apiKey = _configuration["GoogleGemini:ApiKey"];
        if (string.IsNullOrEmpty(apiKey) || apiKey == "YOUR_API_KEY_HERE")
        {
            _logger.LogError("Google Gemini API Key is not configured.");
            return StatusCode(500, new { message = "AI service API key is not configured. Please set GoogleGemini:ApiKey in configuration." });
        }

        var client = _httpClientFactory.CreateClient();

        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = request.Prompt }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.7,
                maxOutputTokens = 300
            }
        };

        var jsonRequest = JsonSerializer.Serialize(requestBody);
        var httpContent = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

        try
        {
            var response = await client.PostAsync(url, httpContent);
            var jsonResponse = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError($"Google Gemini API Error ({response.StatusCode}): {jsonResponse}");
                return StatusCode(502, new { message = "AI service returned an error.", details = jsonResponse });
            }

            using var doc = JsonDocument.Parse(jsonResponse);

            var aiReply = doc.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            return Ok(new { reply = aiReply });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with Google Gemini API.");
            return StatusCode(500, new
            {
                message = "An error occurred while communicating with the AI service.",
                error = ex.Message
            });
        }
    }
}