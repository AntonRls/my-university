using System.ComponentModel.DataAnnotations;
using HacatonMax.University.Structure.Domain;

namespace HacatonMax.University.Structure.Controllers.Dto;

public sealed class CreateGroupRequest
{
    [Required]
    public GroupType Type { get; init; }

    [Required]
    [MaxLength(128)]
    public string Label { get; init; } = string.Empty;

    [Range(1, 500)]
    public int Capacity { get; init; } = 30;

    public bool IsPrimaryAllowed { get; init; } = true;

    public CustomGroupMetaRequest? CustomMeta { get; init; }
}

public sealed class CustomGroupMetaRequest
{
    public long? CreatedByUserId { get; init; }

    [Required]
    public CustomGroupCreatorRole CreatedByRole { get; init; }

    [Required]
    public CustomGroupVisibility Visibility { get; init; }

    [Required]
    public CustomGroupModerationStatus ModerationStatus { get; init; } = CustomGroupModerationStatus.Pending;
}
