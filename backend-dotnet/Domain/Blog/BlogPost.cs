using System;
using System.Collections.Generic;
using MummyJ2Treats.Domain.Common;
using MummyJ2Treats.Domain.Users;

namespace MummyJ2Treats.Domain.Blog;

public class BlogPost : BaseEntity
{
    public string Title { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string Content { get; set; } = null!;
    public bool IsPublished { get; set; }

    public Guid AuthorId { get; set; }
    public User? Author { get; set; }

    public ICollection<BlogMedia> Media { get; set; } = new List<BlogMedia>();
}

public enum BlogMediaType
{
    Image = 0,
    Youtube = 1,
    Instagram = 2,
    TikTok = 3,
    X = 4
}

public class BlogMedia : BaseEntity
{
    public Guid BlogPostId { get; set; }
    public BlogPost? BlogPost { get; set; }

    public BlogMediaType Type { get; set; }
    public string Url { get; set; } = null!;
}

