using System.ComponentModel.DataAnnotations;
using HacatonMax.University.Structure.Domain;

namespace HacatonMax.University.Structure.Controllers.Dto;

public sealed class AddGroupMemberRequest
{
    [Required]
    public long StudentId { get; init; }

    [Required]
    public GroupMembershipType MembershipType { get; init; }
}
