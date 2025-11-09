namespace HacatonMax.University.Auth.Domain;

public interface IJwtService
{
    string GenerateToken(User user);
}
