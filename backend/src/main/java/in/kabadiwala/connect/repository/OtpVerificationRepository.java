package in.kabadiwala.connect.repository; import in.kabadiwala.connect.model.OtpVerification; import org.springframework.data.mongodb.repository.MongoRepository;
public interface OtpVerificationRepository extends MongoRepository<OtpVerification,String> {
java.util.Optional<OtpVerification> findTopByMobileAndPurposeOrderByLastSentAtDesc(String mobile,String purpose);
}
