using System;

namespace SnookerTableManagement.Core.Domain.Constants;

public static class TableConstants
{
    public static readonly Dictionary<int, Guid> FixedTableIds = new()
    {
        { 1, Guid.Parse("43f05db5-154a-4ec6-8c46-f9476eb33a92") },
        { 2, Guid.Parse("7cf979b0-4f96-4191-89d1-0f7f18567154") },
        { 3, Guid.Parse("29a3f339-3d1b-4911-8559-002f2323e206") },
        { 4, Guid.Parse("9d80917a-5900-4100-880c-974577887e41") },
        { 5, Guid.Parse("bc3a3a8b-1e8c-40ad-9457-41718788c9f2") },
        { 6, Guid.Parse("e8383a8b-1e8c-40ad-9457-41718788c9f3") },
        { 7, Guid.Parse("a1383a8b-1e8c-40ad-9457-41718788c9f4") },
        { 8, Guid.Parse("b2383a8b-1e8c-40ad-9457-41718788c9f5") },
        { 9, Guid.Parse("c3383a8b-1e8c-40ad-9457-41718788c9f6") },
        { 10, Guid.Parse("d4383a8b-1e8c-40ad-9457-41718788c9f7") }
    };
}
