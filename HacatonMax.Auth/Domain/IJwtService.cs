namespace HacatonMax.Auth.Domain;

public interface IJwtService
{
    string GenerateToken(User user);
}
