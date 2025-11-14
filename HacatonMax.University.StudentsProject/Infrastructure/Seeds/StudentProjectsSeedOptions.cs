using System;
using System.Collections.Generic;
using System.Globalization;

namespace HacatonMax.University.StudentsProject.Infrastructure.Seeds;

public sealed class StudentProjectsSeedOptions
{
    private const string SeedFlag = "--seed-student-projects";
    private const string ProjectCountFlag = "--seed-projects=";
    private const string MaxParticipantsFlag = "--seed-max-participants=";
    private const string SkillPoolFlag = "--seed-skill-pool=";
    private const string RolePoolFlag = "--seed-role-pool=";
    private const string ForceFlag = "--seed-force";

    public bool Enabled { get; init; }

    public bool ForceReset { get; init; }

    public int ProjectCount { get; init; } = 1000;

    public int MaxParticipantsPerProject { get; init; } = 18;

    public int SkillPoolSize { get; init; } = 60;

    public int TeamRolesPoolSize { get; init; } = 20;

    public static StudentProjectsSeedOptions Parse(string[] args, out string[] filteredArgs)
    {
        var enabled = false;
        var force = false;
        var projectCount = 1000;
        var maxParticipants = 18;
        var skills = 60;
        var roles = 20;

        var remaining = new List<string>(args.Length);
        foreach (var arg in args)
        {
            if (arg.Equals(SeedFlag, StringComparison.OrdinalIgnoreCase))
            {
                enabled = true;
                continue;
            }

            if (arg.Equals(ForceFlag, StringComparison.OrdinalIgnoreCase))
            {
                force = true;
                continue;
            }

            if (TryParseInt(arg, ProjectCountFlag, out var projectsValue))
            {
                projectCount = projectsValue;
                continue;
            }

            if (TryParseInt(arg, MaxParticipantsFlag, out var participantsValue))
            {
                maxParticipants = participantsValue;
                continue;
            }

            if (TryParseInt(arg, SkillPoolFlag, out var skillsValue))
            {
                skills = skillsValue;
                continue;
            }

            if (TryParseInt(arg, RolePoolFlag, out var roleValue))
            {
                roles = roleValue;
                continue;
            }

            remaining.Add(arg);
        }

        filteredArgs = remaining.ToArray();
        return new StudentProjectsSeedOptions
        {
            Enabled = enabled,
            ForceReset = force,
            ProjectCount = Math.Max(10, projectCount),
            MaxParticipantsPerProject = Math.Max(4, maxParticipants),
            SkillPoolSize = Math.Max(10, skills),
            TeamRolesPoolSize = Math.Max(5, roles),
        };
    }

    private static bool TryParseInt(string value, string prefix, out int result)
    {
        if (value.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
        {
            var raw = value.Substring(prefix.Length);
            if (int.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out result))
            {
                return true;
            }
        }

        result = default;
        return false;
    }
}
