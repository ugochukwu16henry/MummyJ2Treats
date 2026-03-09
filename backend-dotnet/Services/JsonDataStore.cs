using System.Text;
using Newtonsoft.Json;
using MummyJ2Treats.Api.Models;

namespace MummyJ2Treats.Api.Services;

/// <summary>
/// Simple JSON-backed data store with file locking.
/// </summary>
public class JsonDataStore
{
    private readonly string _filePath;
    private readonly object _lock = new();

    public JsonDataStore(IWebHostEnvironment env)
    {
        var dataDir = Path.Combine(env.ContentRootPath, "data");
        Directory.CreateDirectory(dataDir);
        _filePath = Path.Combine(dataDir, "store.json");
    }

    public StoreData Load()
    {
        lock (_lock)
        {
            if (!File.Exists(_filePath))
            {
                var seed = new StoreData();
                Save(seed);
                return seed;
            }

            var json = File.ReadAllText(_filePath, Encoding.UTF8);
            if (string.IsNullOrWhiteSpace(json))
            {
                return new StoreData();
            }

            var data = JsonConvert.DeserializeObject<StoreData>(json);
            return data ?? new StoreData();
        }
    }

    public void Save(StoreData data)
    {
        lock (_lock)
        {
            var json = JsonConvert.SerializeObject(data, Formatting.Indented);
            File.WriteAllText(_filePath, json, Encoding.UTF8);
        }
    }
}

