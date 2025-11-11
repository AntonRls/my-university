namespace HacatonMax.Admin.Domain;

public class University
{
    public long Id { get; private set; }

    public string Name { get; private set; }

    public string TenantName { get; private set; }

    public University(string name, string tenantName)
    {
        Name = name;
        TenantName = tenantName;
    }
}
